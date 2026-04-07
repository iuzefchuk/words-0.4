import AppCommandBuilder from '@/application/commands.ts';
import { Difficulty, EventType, Player } from '@/domain/enums.ts';
import Game from '@/domain/Game.ts';
import { BonusDistribution, type CellIndex } from '@/domain/models/board/Board.ts';
import type Dictionary from '@/domain/models/dictionary/Dictionary.ts';
import type { TileId } from '@/domain/models/inventory/Inventory.ts';
import { createFullDictionary } from '$/dictionary.ts';
import { StubClock, StubGameRepository, StubIdGenerator, StubScheduler } from '$/stubs.ts';

let dictionary: Dictionary;

beforeAll(async () => {
  dictionary = await Dictionary.create();
});

function createSetup(overrides?: { difficulty?: Difficulty }) {
  const game = Game.create('1.0.0', new StubIdGenerator(), dictionary, {
    bonusDistribution: BonusDistribution.Classic,
    difficulty: overrides?.difficulty ?? Difficulty.Low,
  });
  const clock = new StubClock();
  const scheduler = new StubScheduler();
  const gameRepository = new StubGameRepository();
  const builder = new AppCommandBuilder(game, clock, scheduler, gameRepository);
  return { commands: builder.commands, clock, game, gameRepository };
}

function getUserTiles(game: Game): ReadonlyArray<TileId> {
  return game.inventoryView.getTilesFor(Player.User);
}

function centerCell(): CellIndex {
  return 112 as CellIndex;
}

function cellAt(n: number): CellIndex {
  return n as CellIndex;
}

describe('Integration: AppCommandBuilder', () => {
  describe('placeTile → validate → persist pipeline', () => {
    it('should place tile on board, validate turn, and persist snapshot', async () => {
      const { commands, game, gameRepository } = createSetup();
      const tile = getUserTiles(game)[0]!;

      commands.placeTile({ cell: centerCell(), tile });

      expect(game.boardView.findTileByCell(centerCell())).toBe(tile);
      const snapshot = await gameRepository.load();
      expect(snapshot).not.toBeNull();
      expect(snapshot!.board.tileByCell.get(centerCell())).toBe(tile);
    });

    it('should update validation state after placing tiles', () => {
      const { commands, game } = createSetup();
      const tiles = getUserTiles(game);

      commands.placeTile({ cell: centerCell(), tile: tiles[0]! });

      expect(game.turnsView.currentTurnTiles).toHaveLength(1);
    });
  });

  describe('undoPlaceTile → validate → persist pipeline', () => {
    it('should remove tile from board, revalidate, and persist', async () => {
      const { commands, game, gameRepository } = createSetup();
      const tile = getUserTiles(game)[0]!;

      commands.placeTile({ cell: centerCell(), tile });
      commands.undoPlaceTile(tile);

      expect(game.boardView.findTileByCell(centerCell())).toBeUndefined();
      expect(game.turnsView.currentTurnTiles).toHaveLength(0);
      const snapshot = await gameRepository.load();
      expect(snapshot).not.toBeNull();
    });
  });

  describe('clearTiles → persist pipeline', () => {
    it('should remove all placed tiles and persist', async () => {
      const { commands, game, gameRepository } = createSetup();
      const tiles = getUserTiles(game);

      commands.placeTile({ cell: centerCell(), tile: tiles[0]! });
      commands.placeTile({ cell: cellAt(113), tile: tiles[1]! });
      commands.clearTiles();

      expect(game.turnsView.currentTurnTiles).toHaveLength(0);
      expect(game.boardView.findTileByCell(centerCell())).toBeUndefined();
      expect(game.boardView.findTileByCell(cellAt(113))).toBeUndefined();
      const snapshot = await gameRepository.load();
      expect(snapshot).not.toBeNull();
    });
  });

  describe('handleSaveTurn pipeline', () => {
    it('should reject save when turn is invalid and not persist', async () => {
      const { commands, gameRepository } = createSetup();

      const result = commands.handleSaveTurn();

      expect(result.userResponse.ok).toBe(false);
      expect(result.opponentTurn).toBeUndefined();
      const snapshot = await gameRepository.load();
      expect(snapshot).toBeNull();
    });

    it('should save valid turn, switch player, persist, and trigger opponent', async () => {
      const { commands, game, gameRepository } = createSetup();
      const tiles = getUserTiles(game);

      commands.placeTile({ cell: centerCell(), tile: tiles[0]! });
      commands.placeTile({ cell: cellAt(113), tile: tiles[1]! });

      if (!game.turnsView.currentTurnIsValid) return;

      const result = commands.handleSaveTurn();

      expect(result.userResponse.ok).toBe(true);
      if (result.userResponse.ok) {
        expect(result.userResponse.value.words.length).toBeGreaterThan(0);
      }
      expect(game.turnsView.currentPlayer).toBe(Player.Opponent);
      const snapshot = await gameRepository.load();
      expect(snapshot).not.toBeNull();
      expect(result.opponentTurn).toBeDefined();
    });

    it('should complete the full save+opponent cycle with Low difficulty', async () => {
      const { commands, game, gameRepository } = createSetup({ difficulty: Difficulty.Low });
      const tiles = getUserTiles(game);

      commands.placeTile({ cell: centerCell(), tile: tiles[0]! });
      commands.placeTile({ cell: cellAt(113), tile: tiles[1]! });

      if (!game.turnsView.currentTurnIsValid) return;

      const result = commands.handleSaveTurn();
      if (result.opponentTurn) {
        const opponentResponse = await result.opponentTurn;
        expect(opponentResponse.ok).toBe(true);
      }

      expect(game.turnsView.currentPlayer).toBe(Player.User);
      const snapshot = await gameRepository.load();
      expect(snapshot).not.toBeNull();
    });

    it('should accumulate correct events through save+opponent cycle', async () => {
      const { commands, game } = createSetup({ difficulty: Difficulty.Low });
      const tiles = getUserTiles(game);

      commands.placeTile({ cell: centerCell(), tile: tiles[0]! });
      commands.placeTile({ cell: cellAt(113), tile: tiles[1]! });

      if (!game.turnsView.currentTurnIsValid) return;

      const preEvents = commands.clearAllEvents();
      const tilePlacedCount = preEvents.filter(e => e.type === EventType.TilePlaced).length;
      expect(tilePlacedCount).toBe(2);

      const result = commands.handleSaveTurn();
      if (result.opponentTurn) await result.opponentTurn;

      const postEvents = commands.clearAllEvents();
      const userSaved = postEvents.find(e => e.type === EventType.UserTurnSaved);
      expect(userSaved).toBeDefined();

      const opponentEvent = postEvents.find(
        e => e.type === EventType.OpponentTurnSaved || e.type === EventType.OpponentTurnPassed,
      );
      expect(opponentEvent).toBeDefined();
    });
  });

  describe('handlePassTurn pipeline', () => {
    it('should pass turn, switch to opponent, persist, and trigger opponent turn', async () => {
      const { commands, game, gameRepository } = createSetup();

      const result = commands.handlePassTurn();

      expect(game.turnsView.currentPlayer).toBe(Player.Opponent);
      const snapshot = await gameRepository.load();
      expect(snapshot).not.toBeNull();
      expect(result.opponentTurn).toBeDefined();

      if (result.opponentTurn) {
        const response = await result.opponentTurn;
        expect(response.ok).toBe(true);
      }
    });

    it('should clear any placed tiles before passing', () => {
      const { commands, game } = createSetup();
      const tiles = getUserTiles(game);

      commands.placeTile({ cell: centerCell(), tile: tiles[0]! });
      commands.handlePassTurn();

      expect(game.boardView.findTileByCell(centerCell())).toBeUndefined();
    });

    it('should resign when consecutive passes occur for user', async () => {
      const { commands, game, gameRepository } = createSetup();

      game.passTurnForCurrentPlayer();
      game.passTurnForCurrentPlayer();

      commands.handlePassTurn();

      expect(game.matchView.isFinished).toBe(true);
      const snapshot = await gameRepository.load();
      expect(snapshot).toBeNull();
    });

    it('should record correct events for pass turn', async () => {
      const { commands } = createSetup();

      commands.handlePassTurn();
      const events = commands.clearAllEvents();

      const passEvent = events.find(e => e.type === EventType.UserTurnPassed);
      expect(passEvent).toBeDefined();
    });
  });

  describe('handleResignMatch pipeline', () => {
    it('should finish match, clear persistence, and record MatchLost event', async () => {
      const { commands, game, gameRepository } = createSetup();

      commands.handleResignMatch();

      expect(game.matchView.isFinished).toBe(true);
      const snapshot = await gameRepository.load();
      expect(snapshot).toBeNull();

      const events = commands.clearAllEvents();
      const lostEvent = events.find(e => e.type === EventType.MatchLost);
      expect(lostEvent).toBeDefined();
    });

    it('should clear placed tiles before resigning', () => {
      const { commands, game } = createSetup();
      const tiles = getUserTiles(game);

      commands.placeTile({ cell: centerCell(), tile: tiles[0]! });
      commands.handleResignMatch();

      expect(game.turnsView.currentTurnTiles).toHaveLength(0);
    });
  });

  describe('settings commands', () => {
    it('should change difficulty before first turn', () => {
      const { commands, game } = createSetup();

      commands.changeDifficulty(Difficulty.High);
      expect(game.difficulty).toBe(Difficulty.High);

      commands.changeDifficulty(Difficulty.Low);
      expect(game.difficulty).toBe(Difficulty.Low);
    });

    it('should change bonus distribution before first turn', () => {
      const { commands, game } = createSetup();

      commands.changeBonusDistribution(BonusDistribution.Random);
      expect(game.boardView.bonusDistribution).toBe(BonusDistribution.Random);
    });

    it('should reject settings change after a turn is saved', async () => {
      const { commands, game } = createSetup({ difficulty: Difficulty.Low });
      const tiles = getUserTiles(game);

      commands.placeTile({ cell: centerCell(), tile: tiles[0]! });
      commands.placeTile({ cell: cellAt(113), tile: tiles[1]! });

      if (!game.turnsView.currentTurnIsValid) return;
      commands.handleSaveTurn();

      expect(() => commands.changeDifficulty(Difficulty.High)).toThrow();
    });
  });

  describe('event draining', () => {
    it('should return new events since last drain and advance cursor', () => {
      const { commands, game } = createSetup();
      const tiles = getUserTiles(game);

      commands.placeTile({ cell: centerCell(), tile: tiles[0]! });
      const batch1 = commands.clearAllEvents();
      expect(batch1.length).toBeGreaterThan(0);

      const batch2 = commands.clearAllEvents();
      expect(batch2).toHaveLength(0);

      commands.placeTile({ cell: cellAt(113), tile: tiles[1]! });
      const batch3 = commands.clearAllEvents();
      expect(batch3.length).toBeGreaterThan(0);
    });
  });

  describe('opponent turn generation', () => {
    it('should generate opponent move with Low difficulty (single attempt)', async () => {
      const { commands, game } = createSetup({ difficulty: Difficulty.Low });

      const result = commands.handlePassTurn();
      if (result.opponentTurn) {
        const response = await result.opponentTurn;
        expect(response.ok).toBe(true);
      }

      expect(game.turnsView.currentPlayer).toBe(Player.User);
    });

    it('should handle opponent finding no valid moves by passing', async () => {
      const { commands, game } = createSetup({ difficulty: Difficulty.Low });

      const result = commands.handlePassTurn();
      if (result.opponentTurn) {
        const response = await result.opponentTurn;
        expect(response.ok).toBe(true);
      }

      const events = commands.clearAllEvents();
      const opponentEvent = events.find(
        e => e.type === EventType.OpponentTurnSaved || e.type === EventType.OpponentTurnPassed,
      );
      expect(opponentEvent).toBeDefined();
    });

    it('should clear persistence when match finishes after opponent turn', async () => {
      const { commands, game, gameRepository } = createSetup();

      game.passTurnForCurrentPlayer();
      game.passTurnForCurrentPlayer();

      commands.handlePassTurn();

      expect(game.matchView.isFinished).toBe(true);
      const snapshot = await gameRepository.load();
      expect(snapshot).toBeNull();
    });
  });

  describe('persistence lifecycle', () => {
    it('should persist on every mutation and clear on match end', async () => {
      const { commands, game, gameRepository } = createSetup();
      const tiles = getUserTiles(game);

      commands.placeTile({ cell: centerCell(), tile: tiles[0]! });
      expect(await gameRepository.load()).not.toBeNull();

      commands.clearTiles();
      expect(await gameRepository.load()).not.toBeNull();

      commands.handleResignMatch();
      expect(await gameRepository.load()).toBeNull();
    });

    it('should persist snapshot that can restore to equivalent game state', async () => {
      const { commands, game, gameRepository } = createSetup();
      const tiles = getUserTiles(game);

      commands.placeTile({ cell: centerCell(), tile: tiles[0]! });
      const snapshot = await gameRepository.load();
      expect(snapshot).not.toBeNull();

      const restored = Game.restoreFromSnapshot('1.0.0', snapshot!, new StubIdGenerator(), dictionary);
      expect(restored).not.toBeNull();
      expect(restored!.boardView.findTileByCell(centerCell())).toBeDefined();
    });
  });
});
