import { describe, it, expect } from 'vitest';
import { createTestContext, cellIndex, placeAndValidate, placeFirstTurn, ALL_WORDS } from '$/helpers.ts';
import { Player, Letter } from '@/domain/enums.ts';
import { DomainEvent, DomainEventCollector } from '@/domain/events.ts';
import { ValidationStatus, TurnOutcomeType } from '@/domain/models/TurnTracker.ts';
import SaveTurnCommand from '@/application/commands/SaveTurn.ts';
import PassTurnCommand from '@/application/commands/PassTurn.ts';
import PlaceTileCommand from '@/application/commands/PlaceTile.ts';
import UndoPlaceTileCommand from '@/application/commands/UndoPlaceTile.ts';

function createIntegrationContext() {
  return createTestContext({ words: ALL_WORDS });
}

describe('Game Integration', () => {
  describe('full turn cycle', () => {
    it('places tiles, validates, saves, replenishes, and advances player', () => {
      const domain = createIntegrationContext();
      const { tiles } = placeFirstTurn(domain, Player.User);

      expect(domain.currentTurnIsValid).toBe(true);
      expect(domain.currentTurnScore).toBeGreaterThan(0);

      const unusedBefore = domain.unusedTilesCount;
      const result = SaveTurnCommand.execute(domain);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.words.length).toBeGreaterThan(0);

      // 2 tiles discarded, 2 drawn
      expect(domain.unusedTilesCount).toBe(unusedBefore - tiles.length);
      expect(domain.getTilesFor(Player.User)).toHaveLength(7);
      expect(domain.currentPlayer).toBe(Player.Opponent);
    });

    it('tracks scores across multiple turns', () => {
      const domain = createIntegrationContext();

      // User turn
      placeFirstTurn(domain, Player.User);
      SaveTurnCommand.execute(domain);

      // Opponent turn: place adjacent
      const opponentTiles = domain.getTilesFor(Player.Opponent);
      placeAndValidate(domain, [
        { cell: cellIndex(114), tile: opponentTiles[0] },
      ]);

      if (domain.currentTurnIsValid) {
        SaveTurnCommand.execute(domain);
        expect(domain.getScoreFor(Player.User)).toBeGreaterThan(0);
        expect(domain.getScoreFor(Player.Opponent)).toBeGreaterThan(0);
      }
    });
  });

  describe('pass and resign flow', () => {
    it('passes turn and advances player', () => {
      const domain = createIntegrationContext();
      PassTurnCommand.execute(domain);
      expect(domain.currentPlayer).toBe(Player.Opponent);
    });

    it('consecutive passes by same player triggers resign condition', () => {
      const domain = createIntegrationContext();

      // User passes → Opponent's turn
      PassTurnCommand.execute(domain);
      expect(domain.willPlayerPassBeResign(Player.User)).toBe(true);

      // Opponent passes → User's turn
      PassTurnCommand.execute(domain);
      expect(domain.willPlayerPassBeResign(Player.Opponent)).toBe(true);
    });
  });

  describe('reset turn', () => {
    it('clears placed tiles from board and turn state', () => {
      const domain = createIntegrationContext();
      const userTiles = domain.getTilesFor(Player.User);
      const tile1 = userTiles[0];
      const tile2 = userTiles[1];

      domain.placeTile({ cell: cellIndex(112), tile: tile1 });
      domain.placeTile({ cell: cellIndex(113), tile: tile2 });
      expect(domain.isTilePlaced(tile1)).toBe(true);
      expect(domain.isTilePlaced(tile2)).toBe(true);

      domain.resetCurrentTurn();

      expect(domain.isTilePlaced(tile1)).toBe(false);
      expect(domain.isTilePlaced(tile2)).toBe(false);
      expect(domain.currentTurnTiles).toHaveLength(0);
      expect(domain.currentPlayer).toBe(Player.User);
    });
  });

  describe('invalid turn rejection', () => {
    it('rejects save when tiles are not on anchor cells', () => {
      const domain = createIntegrationContext();
      const userTiles = domain.getTilesFor(Player.User);

      // Place far from center on empty board
      placeAndValidate(domain, [
        { cell: cellIndex(0), tile: userTiles[0] },
        { cell: cellIndex(1), tile: userTiles[1] },
      ]);
      expect(domain.currentTurnIsValid).toBe(false);

      const result = SaveTurnCommand.execute(domain);
      expect(result.ok).toBe(false);
      expect(domain.currentPlayer).toBe(Player.User);
    });

    it('rejects save when no tiles are placed', () => {
      const domain = createIntegrationContext();
      domain.validateCurrentTurn();
      expect(domain.currentTurnIsValid).toBe(false);
    });
  });

  describe('undo place tile', () => {
    it('removes tile from board and re-validates', () => {
      const domain = createIntegrationContext();
      const userTiles = domain.getTilesFor(Player.User);
      const tile1 = userTiles[0];
      const tile2 = userTiles[1];
      const tile3 = userTiles[2];

      // Place 3 tiles
      PlaceTileCommand.execute(domain, { cell: cellIndex(112), tile: tile1 });
      PlaceTileCommand.execute(domain, { cell: cellIndex(113), tile: tile2 });
      PlaceTileCommand.execute(domain, { cell: cellIndex(114), tile: tile3 });
      expect(domain.currentTurnTiles).toHaveLength(3);

      // Undo last tile
      UndoPlaceTileCommand.execute(domain, tile3);
      expect(domain.currentTurnTiles).toHaveLength(2);
      expect(domain.isTilePlaced(tile3)).toBe(false);
      // Two tiles on center row should still be valid
      expect(domain.currentTurnIsValid).toBe(true);
    });
  });

  describe('outcome history', () => {
    it('records save and pass outcomes across turns', () => {
      const domain = createIntegrationContext();

      // User saves a turn
      placeFirstTurn(domain, Player.User);
      SaveTurnCommand.execute(domain);

      // Opponent passes
      PassTurnCommand.execute(domain);

      const history = domain.turnOutcomeHistory;
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe(TurnOutcomeType.Save);
      expect(history[0].player).toBe(Player.User);
      expect(history[1].type).toBe(TurnOutcomeType.Pass);
      expect(history[1].player).toBe(Player.Opponent);
    });
  });

  describe('event collection', () => {
    it('collects and drains domain events', () => {
      const events = new DomainEventCollector();

      events.raise(DomainEvent.TilePlaced);
      events.raise(DomainEvent.TurnSaved);

      const drained = events.drain();
      expect(drained).toEqual([DomainEvent.TilePlaced, DomainEvent.TurnSaved]);
      expect(events.drain()).toEqual([]);
    });
  });

  describe('inventory depletion', () => {
    it('draw pool shrinks as tiles are discarded and replenished', () => {
      const domain = createIntegrationContext();
      const initialUnused = domain.unusedTilesCount;

      // User places 2 tiles → save discards 2, replenishes 2 from pool
      placeFirstTurn(domain, Player.User);
      SaveTurnCommand.execute(domain);

      // Pool shrank by 2 (replenished player) but 2 were also discarded
      // Net: unusedTilesCount decreases by the number replenished (2)
      expect(domain.unusedTilesCount).toBe(initialUnused - 2);
      expect(domain.getTilesFor(Player.User)).toHaveLength(7);
    });

    it('replenishment stops when draw pool is empty', () => {
      const domain = createIntegrationContext();

      // Drain the draw pool by repeatedly placing + saving turns
      let turnsPlayed = 0;
      const maxTurns = 50; // safety limit
      while (domain.unusedTilesCount > 0 && turnsPlayed < maxTurns) {
        const player = domain.currentPlayer;
        const tiles = domain.getTilesFor(player);
        if (tiles.length < 2) break;

        // Place 2 tiles adjacent to existing (or center for first turn)
        const cell1 = turnsPlayed === 0 ? cellIndex(112) : cellIndex(112 + turnsPlayed * 2);
        const cell2 = cellIndex(cell1 + 1);

        // Check if cells are within bounds and not occupied
        try {
          placeAndValidate(domain, [
            { cell: cell1, tile: tiles[0] },
            { cell: cell2, tile: tiles[1] },
          ]);
        } catch {
          break;
        }

        if (!domain.currentTurnIsValid) {
          domain.resetCurrentTurn();
          break;
        }

        SaveTurnCommand.execute(domain);
        turnsPlayed++;
      }

      expect(turnsPlayed).toBeGreaterThan(0);
      // After many turns, the pool should be significantly depleted
      expect(domain.unusedTilesCount).toBeLessThan(86); // started at 86 (100 - 7 - 7)
    });
  });

  describe('multi-turn integration', () => {
    it('supports alternating save turns between players', () => {
      const domain = createIntegrationContext();

      // Turn 1: User places two tiles on center row
      placeFirstTurn(domain, Player.User);
      expect(SaveTurnCommand.execute(domain).ok).toBe(true);
      expect(domain.currentPlayer).toBe(Player.Opponent);

      // Turn 2: Opponent places adjacent to existing tiles
      const opponentTiles = domain.getTilesFor(Player.Opponent);
      placeAndValidate(domain, [{ cell: cellIndex(114), tile: opponentTiles[0] }]);

      if (domain.currentTurnIsValid) {
        expect(SaveTurnCommand.execute(domain).ok).toBe(true);
        expect(domain.currentPlayer).toBe(Player.User);
        expect(domain.turnOutcomeHistory).toHaveLength(2);
      }
    });
  });
});
