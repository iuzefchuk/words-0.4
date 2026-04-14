import Board from '@/domain/models/board/Board.ts';
import { BoardType } from '@/domain/models/board/enums.ts';
import BonusService from '@/domain/models/board/services/bonus/BonusService.ts';
import { Cell } from '@/domain/models/board/types.ts';
import CryptoSeedingService from '@/infrastructure/services/CryptoSeedingService.ts';

describe('Board', () => {
  it('has correct number of cells per axis', () => {
    expect(Board.CELLS_PER_AXIS).toBe(Math.sqrt(Board.TOTAL_CELLS));
  });

  it('calculates cells by index correctly', () => {
    expect(Board.CELLS_BY_INDEX).toHaveLength(Board.TOTAL_CELLS);
  });

  it('calculates center cell correctly', () => {
    const mid = Math.floor(Board.CELLS_PER_AXIS / 2);
    const centerValue = (mid * Board.CELLS_PER_AXIS + mid) as Cell;
    expect(Board.CENTER_CELL).toBe(centerValue);
  });

  it('clones itself correctly', () => {
    // TODO clone - test if all fields are cloned correctly and if the clone is independent from the source (modifying clone doesn't modify source and vice versa)
  });

  it('creates itself correctly', () => {
    // TODO create
  });

  it('calculates anchor cells correctly', () => {
    // TODO calculateAnchorCells - test for game at different stages - empty board, board with some tiles placed, etc.
  });

  it('calculates axis correctly', () => {
    // TODO calculateAxis - for every cell combo possible
    // also, test negative cases - cells that are not in line, etc.
  });

  it('creates placement correctly', () => {
    // TODO createPlacement - for every coords and tiles possible
    // also, test negative cases - invalid coords, empty tiles, etc.
  });

  it('finds cell correctly', () => {
    // TODO findCellByTile, isCellOccupied - after 1) placeTile, 2) placeTile + undoPlaceTile
    // also, implement for every cell possible
    // also, test negative case - finding cell for tile that is not placed
  });

  it('finds tile correctly', () => {
    // TODO findTileByCell, isTilePlaced  - after 1) placeTile, 2) placeTile + undoPlaceTile
    // also, implement for every tile & cell possible
    // also, test negative case - finding tile for cell that is not occupied
  });

  it('calculates multipliers for letter correctly', () => {
    const seedingService = new CryptoSeedingService();
    Object.values(BoardType).forEach(type => {
      const seed = seedingService.createSeed();
      const board = Board.create(type, seedingService.createRandomizer(seed));
      const distribution = BonusService.createBonusDistribution(type, seedingService.createRandomizer(seed));
      distribution.forEach((bonus, cell) => expect(board.getMultiplierForLetter(cell)).not.toBeNull());
    });
  });

  it('calculates multipliers for word correctly', () => {
    const seedingService = new CryptoSeedingService();
    Object.values(BoardType).forEach(type => {
      const seed = seedingService.createSeed();
      const board = Board.create(type, seedingService.createRandomizer(seed));
      const distribution = BonusService.createBonusDistribution(type, seedingService.createRandomizer(seed));
      distribution.forEach((bonus, cell) => expect(board.getMultiplierForWord(cell)).not.toBeNull());
    });
  });

  it('places tile correctly', () => {
    // TODO placeTile - implement for every tile & cell possible
    // also, test negative cases - placing tile on occupied cell, placing tile that is already placed, etc.
  });

  it('resolves placement correctly', () => {
    // TODO resolvePlacement -implement for every tile combo possible
    // also, test negative case - resolving placement with tile that is not placed
  });

  it('undoes place tile correctly', () => {
    // TODO undoPlaceTile - implement for every case in 'places tile correctly'
    // also, test negative case - undoing tile that is not placed
  });
});
