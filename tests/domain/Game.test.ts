import { describe, it, expect } from 'vitest';
import { createTestContext, cellIndex, placeAndValidate, ALL_WORDS } from '$/helpers.ts';
import { Player } from '@/domain/enums.ts';

describe('Game (domain)', () => {
  it('starts with User as current player', () => {
    const domain = createTestContext();
    expect(domain.currentPlayer).toBe(Player.User);
  });

  it('has no prior turns initially', () => {
    const domain = createTestContext();
    expect(domain.hasPriorTurns).toBe(false);
  });

  describe('placeTile / undoPlaceTile', () => {
    it('places a tile on both board and history', () => {
      const domain = createTestContext();
      const userTiles = domain.getTilesFor(Player.User);
      const tile = userTiles[0];
      domain.placeTile({ cell: cellIndex(112), tile });

      expect(domain.isTilePlaced(tile)).toBe(true);
      expect(domain.currentTurnTiles).toHaveLength(1);
    });

    it('undoes a tile placement from both board and history', () => {
      const domain = createTestContext();
      const userTiles = domain.getTilesFor(Player.User);
      const tile = userTiles[0];
      domain.placeTile({ cell: cellIndex(112), tile });
      domain.undoPlaceTile({ tile });

      expect(domain.isTilePlaced(tile)).toBe(false);
      expect(domain.currentTurnTiles).toHaveLength(0);
    });
  });

  describe('resetCurrentTurn', () => {
    it('removes all placed tiles from board and history', () => {
      const domain = createTestContext();
      const userTiles = domain.getTilesFor(Player.User);
      const tile1 = userTiles[0];
      const tile2 = userTiles[1];
      domain.placeTile({ cell: cellIndex(112), tile: tile1 });
      domain.placeTile({ cell: cellIndex(113), tile: tile2 });
      domain.resetCurrentTurn();

      expect(domain.isTilePlaced(tile1)).toBe(false);
      expect(domain.isTilePlaced(tile2)).toBe(false);
      expect(domain.currentTurnTiles).toHaveLength(0);
    });
  });

  describe('saveCurrentTurn', () => {
    it('throws when turn is not valid', () => {
      const domain = createTestContext();
      expect(() => domain.saveCurrentTurn()).toThrow('not valid');
    });

    it('advances to next player when valid', () => {
      const domain = createTestContext({ words: ALL_WORDS });
      placeAndValidate(domain, [
        { cell: cellIndex(112), tile: domain.getTilesFor(Player.User)[0] },
        { cell: cellIndex(113), tile: domain.getTilesFor(Player.User)[1] },
      ]);
      domain.saveCurrentTurn();

      expect(domain.currentPlayer).toBe(Player.Opponent);
      expect(domain.hasPriorTurns).toBe(true);
    });
  });

  describe('passCurrentTurn', () => {
    it('advances to next player', () => {
      const domain = createTestContext();
      domain.passCurrentTurn();
      expect(domain.currentPlayer).toBe(Player.Opponent);
    });

    it('records pass action', () => {
      const domain = createTestContext();
      domain.passCurrentTurn();
      expect(domain.willPlayerPassBeResign(Player.User)).toBe(true);
    });
  });

  describe('getScoreFor', () => {
    it('returns 0 initially', () => {
      const domain = createTestContext();
      expect(domain.getScoreFor(Player.User)).toBe(0);
      expect(domain.getScoreFor(Player.Opponent)).toBe(0);
    });
  });

  describe('validation state', () => {
    it('starts without error or score', () => {
      const domain = createTestContext();
      expect(domain.currentTurnError).toBeUndefined();
      expect(domain.currentTurnScore).toBeUndefined();
      expect(domain.currentTurnWords).toBeUndefined();
      expect(domain.currentTurnIsValid).toBe(false);
    });

    it('reflects validation result after validateCurrentTurn', () => {
      const domain = createTestContext({ words: ALL_WORDS });
      const userTiles = domain.getTilesFor(Player.User);
      domain.placeTile({ cell: cellIndex(112), tile: userTiles[0] });
      domain.placeTile({ cell: cellIndex(113), tile: userTiles[1] });
      domain.validateCurrentTurn();

      expect(domain.currentTurnIsValid).toBe(true);
      expect(domain.currentTurnScore).toBeGreaterThan(0);
      expect(domain.currentTurnWords).toBeDefined();
      expect(domain.currentTurnWords!.length).toBeGreaterThan(0);
    });
  });

});
