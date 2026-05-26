import { beforeEach, describe, expect, test } from 'vitest';
import fixtures from '@/domain/models/board/Board.fixtures.ts';
import Board from '@/domain/models/board/Board.ts';
import { Axis, Bonus, Type } from '@/domain/models/board/enums.ts';
import LayoutService from '@/domain/models/board/services/layout/LayoutService.ts';
import { Cell, Placement } from '@/domain/models/board/types.ts';
import { GameTile } from '@/domain/types/index.ts';

class IndexMatrix {
  get entries(): ReadonlyArray<{ cell: number; column: number; row: number }> {
    return this.grid.flatMap((rowCells, row) => rowCells.map((cell, column) => ({ cell, column, row })));
  }

  private get grid(): ReadonlyArray<ReadonlyArray<number>> {
    return Array.from({ length: this.size }, (_, row) =>
      Array.from({ length: this.size }, (_, column) => row * this.size + column),
    );
  }

  constructor(public readonly size: number) {}

  getCollinearIndices(axis: Axis, row: number, column: number): ReadonlyArray<number> {
    switch (axis) {
      case Axis.X: {
        const rowCells = this.grid[row];
        if (rowCells === undefined) throw new ReferenceError(`expected row at index ${String(row)}, got undefined`);
        return rowCells;
      }
      case Axis.Y: {
        return this.grid.map(otherRow => {
          const columnCell = otherRow[column];
          if (columnCell === undefined) throw new ReferenceError(`expected cell at column ${String(column)}, got undefined`);
          return columnCell;
        });
      }
      default:
        throw new ReferenceError(`expected axis to be one of ${Object.values(Axis).join(', ')}, got ${String(axis)}`);
    }
  }

  getOrthogonalNeighbors(row: number, column: number): ReadonlyArray<number> {
    const offsets: ReadonlyArray<readonly [number, number]> = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];
    return offsets
      .map(([rowOffset, columnOffset]) => this.grid[row + rowOffset]?.[column + columnOffset])
      .filter((value): value is number => value !== undefined);
  }
}

function buildSymmetryQuadruples(size: number): ReadonlyArray<readonly [number, number, number, number]> {
  const last = size - 1;
  const quadruples: Array<readonly [number, number, number, number]> = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      quadruples.push([row * size + col, row * size + (last - col), (last - row) * size + col, col * size + row]);
    }
  }
  return quadruples;
}

describe('Board', () => {
  const matrix = new IndexMatrix(LayoutService.CELLS_PER_AXIS);

  describe.each(fixtures)('for $desc', ({ instance, meta: { placements, unusedCells, unusedTiles } }) => {
    describe('anchorCells', () => {
      test('does not return duplicate cells', () => {
        const result = [...instance.anchorCells];
        const duplicateCells = result.filter((cell, idx) => result.indexOf(cell) !== idx);
        expect(duplicateCells).toEqual([]);
      });

      test('does not return occupied cells', () => {
        const occupiedCells = [...instance.anchorCells].filter(cell => instance.isCellOccupied(cell));
        expect(occupiedCells).toEqual([]);
      });

      if (placements.length === 0)
        test('returns only CENTER_CELL on empty board', () => {
          expect([...instance.anchorCells]).toEqual([LayoutService.CENTER_CELL]);
        });

      if (placements.length > 0)
        test('does not return cells w/out adjacent tiles', () => {
          const withoutAdjacentTiles = [...instance.anchorCells].filter(
            cell => !instance.getAdjacentCells(cell).some(adj => instance.isCellOccupied(adj)),
          );
          expect(withoutAdjacentTiles).toEqual([]);
        });

      if (placements.length > 0 && unusedCells.length > 0)
        test('returns non-empty set on partial board', () => {
          expect(instance.anchorCells.size).toBeGreaterThan(0);
        });
    });

    describe('clone', () => {
      test('returns instance w/ same state', () => {
        expect(Board.clone(instance)).toEqual(instance);
      });
    });

    describe('findCellByTile', () => {
      describe.each(placements)('for placed tile $tile', ({ cell, tile }) => {
        test('returns cell $cell', () => {
          expect(instance.findCellByTile(tile)).toBe(cell);
        });
      });

      describe.each(unusedTiles)('for unplaced tile %s', tile => {
        test('does not return a cell', () => {
          expect(instance.findCellByTile(tile)).toBeUndefined();
        });
      });
    });

    describe('findTileByCell', () => {
      describe.each(placements)('for occupied cell $cell', ({ cell, tile }) => {
        test('returns tile $tile', () => {
          expect(instance.findTileByCell(cell)).toBe(tile);
        });
      });

      describe.each(unusedCells)('for unoccupied cell %i', cell => {
        test('does not return a tile', () => {
          expect(instance.findTileByCell(cell)).toBeUndefined();
        });
      });
    });

    describe('isCellOccupied', () => {
      describe.each(placements)('for occupied cell $cell', ({ cell }) => {
        test('returns true', () => {
          expect(instance.isCellOccupied(cell)).toBe(true);
        });
      });

      describe.each(unusedCells)('for unoccupied cell %i', cell => {
        test('returns false', () => {
          expect(instance.isCellOccupied(cell)).toBe(false);
        });
      });
    });

    describe('isTilePlaced', () => {
      describe.each(placements)('for placed tile $tile', ({ tile }) => {
        test('returns true', () => {
          expect(instance.isTilePlaced(tile)).toBe(true);
        });
      });

      describe.each(unusedTiles)('for unplaced tile %s', tile => {
        test('returns false', () => {
          expect(instance.isTilePlaced(tile)).toBe(false);
        });
      });
    });

    describe('resolvePlacement', () => {
      describe.each(placements)('for $cell and $tile', ({ cell, tile }) => {
        test('resolves placement', () => {
          expect(instance.resolvePlacement([tile])).toEqual([{ cell, tile }]);
        });
      });

      if (placements.length >= 2)
        test('returns links sorted by cell ascending', () => {
          const tilesInReverseOrder = [...placements].sort((first, second) => second.cell - first.cell).map(({ tile }) => tile);
          const result = instance.resolvePlacement(tilesInReverseOrder);
          const cellsAscending = [...placements].sort((first, second) => first.cell - second.cell).map(({ cell }) => cell);
          expect(result.map(({ cell }) => cell)).toEqual(cellsAscending);
        });
    });
  });

  describe.each(Object.values(Type))('for %s type', type => {
    describe('create', () => {
      test('does not assign bonus to center cell', () => {
        const board = Board.create(type, () => 0.5);
        const centerCell = board.cells.find(cell => board.isCellCenter(cell));
        if (centerCell === undefined) throw new ReferenceError('expected center cell, got undefined');
        expect(board.getBonus(centerCell)).toBeNull();
      });

      test('assigns expected count per bonus', () => {
        const board = Board.create(type, () => 0.5);
        const counts = new Map<Bonus, number>();
        for (const cell of board.cells) {
          const bonus = board.getBonus(cell);
          if (bonus !== null) counts.set(bonus, (counts.get(bonus) ?? 0) + 1);
        }
        expect(Object.fromEntries(counts)).toEqual({
          [Bonus.DoubleLetter]: 24,
          [Bonus.DoubleWord]: 16,
          [Bonus.TripleLetter]: 12,
          [Bonus.TripleWord]: 8,
        });
      });
    });

    describe.each(Object.values(Type).filter(otherType => otherType !== type))('comparing w/ %s type', otherType => {
      test('assigns different bonuses', () => {
        const randomizer = (): number => 0.5;
        const board = Board.create(type, randomizer);
        const otherBoard = Board.create(otherType, randomizer);
        const sameBonuses = board.cells.every(cell => board.getBonus(cell) === otherBoard.getBonus(cell));
        expect(sameBonuses).toBe(false);
      });
    });
  });

  describe('for Preset type', () => {
    test('assigns same bonuses across boards', () => {
      const first = Board.create(Type.Preset);
      const second = Board.create(Type.Preset);
      const mismatches = first.cells.filter(cell => first.getBonus(cell) !== second.getBonus(cell));
      expect(mismatches).toEqual([]);
    });

    test('assigns D4-symmetric bonuses', () => {
      const board = Board.create(Type.Preset);
      const symmetryQuadruples = buildSymmetryQuadruples(board.cellsPerAxis) as ReadonlyArray<readonly [Cell, Cell, Cell, Cell]>;
      const asymmetric = symmetryQuadruples.filter(([origin, horizontal, vertical, diagonal]) => {
        const originBonus = board.getBonus(origin);
        return (
          board.getBonus(horizontal) !== originBonus ||
          board.getBonus(vertical) !== originBonus ||
          board.getBonus(diagonal) !== originBonus
        );
      });
      expect(asymmetric).toEqual([]);
    });
  });

  describe('for Random type', () => {
    describe('w/ same randomizer', () => {
      test('assigns same bonuses', () => {
        const randomizer = (): number => 0.5;
        const first = Board.create(Type.Random, randomizer);
        const second = Board.create(Type.Random, randomizer);
        const mismatches = first.cells.filter(cell => first.getBonus(cell) !== second.getBonus(cell));
        expect(mismatches).toEqual([]);
      });
    });

    describe('w/ different randomizers', () => {
      test('assigns different bonuses', () => {
        const first = Board.create(Type.Random, () => 0.25);
        const second = Board.create(Type.Random, () => 0.5);
        const sameBonuses = first.cells.every(cell => first.getBonus(cell) === second.getBonus(cell));
        expect(sameBonuses).toBe(false);
      });
    });

    describe('w/out randomizer', () => {
      test('assigns different bonuses', () => {
        const first = Board.create(Type.Random);
        const second = Board.create(Type.Random);
        const sameBonuses = first.cells.every(cell => first.getBonus(cell) === second.getBonus(cell));
        expect(sameBonuses).toBe(false);
      });
    });
  });

  describe('calculateAxis', () => {
    const xAxisStep = 1;
    const yAxisStep = LayoutService.CELLS_PER_AXIS;
    const inputCell = 112 as Cell;
    const placedTile = 'A' as GameTile;
    let board: Board;

    beforeEach(() => {
      board = Board.create(Type.Preset);
    });

    test('returns default for single cell w/out occupied adjacents', () => {
      expect(board.calculateAxis([inputCell])).toBe(LayoutService.DEFAULT_AXIS);
    });

    test('returns x for single cell w/ first right occupied adjacent', () => {
      board.placeTile(inputCell, placedTile);
      expect(board.calculateAxis([(inputCell - xAxisStep) as Cell])).toBe(Axis.X);
    });

    test('returns x for single cell w/ first left occupied adjacent', () => {
      board.placeTile(inputCell, placedTile);
      expect(board.calculateAxis([(inputCell + xAxisStep) as Cell])).toBe(Axis.X);
    });

    test('returns y for single cell w/ first bottom occupied adjacent', () => {
      board.placeTile(inputCell, placedTile);
      expect(board.calculateAxis([(inputCell - yAxisStep) as Cell])).toBe(Axis.Y);
    });

    test('returns y for single cell w/ first top occupied adjacent', () => {
      board.placeTile(inputCell, placedTile);
      expect(board.calculateAxis([(inputCell + yAxisStep) as Cell])).toBe(Axis.Y);
    });

    test('returns x for horizontal cell combo', () => {
      expect(board.calculateAxis([inputCell, (inputCell + xAxisStep) as Cell, (inputCell + xAxisStep * 2) as Cell])).toBe(Axis.X);
    });

    test('returns y for vertical cell combo', () => {
      expect(board.calculateAxis([inputCell, (inputCell + yAxisStep) as Cell, (inputCell + yAxisStep * 2) as Cell])).toBe(Axis.Y);
    });

    test('returns null for diagonal cell combo', () => {
      expect(
        board.calculateAxis([
          inputCell,
          (inputCell + xAxisStep + yAxisStep) as Cell,
          (inputCell + (xAxisStep + yAxisStep) * 2) as Cell,
        ]),
      ).toBeNull();
    });

    test('returns null for unconnected cell combo', () => {
      expect(board.calculateAxis([inputCell, 100 as Cell, 200 as Cell])).toBeNull();
    });
  });

  describe('getMultiplierForLetter', () => {
    const board = Board.create(Type.Preset);
    const cellWithoutBonus = board.cells.find(cell => board.getBonus(cell) === null);
    const cellDouble = board.cells.find(cell => board.getBonus(cell) === Bonus.DoubleLetter);
    const cellTriple = board.cells.find(cell => board.getBonus(cell) === Bonus.TripleLetter);

    if (cellWithoutBonus !== undefined)
      test('returns 1 for cell w/out bonus', () => {
        expect(board.getMultiplierForLetter(cellWithoutBonus)).toBe(1);
      });

    if (cellDouble !== undefined)
      test('returns greater than 1 for cell w/ double bonus', () => {
        expect(board.getMultiplierForLetter(cellDouble)).toBeGreaterThan(1);
      });

    if (cellTriple !== undefined)
      test('returns greater than 1 for cell w/ triple bonus', () => {
        expect(board.getMultiplierForLetter(cellTriple)).toBeGreaterThan(1);
      });

    if (cellWithoutBonus !== undefined && cellDouble !== undefined && cellTriple !== undefined)
      test('returns different values for cells w/ different bonuses', () => {
        expect(board.getMultiplierForLetter(cellWithoutBonus)).not.toBe(board.getMultiplierForLetter(cellDouble));
        expect(board.getMultiplierForLetter(cellWithoutBonus)).not.toBe(board.getMultiplierForLetter(cellTriple));
        expect(board.getMultiplierForLetter(cellDouble)).not.toBe(board.getMultiplierForLetter(cellTriple));
      });
  });

  describe('getMultiplierForWord', () => {
    const board = Board.create(Type.Preset);
    const cellWithoutBonus = board.cells.find(cell => board.getBonus(cell) === null);
    const cellDouble = board.cells.find(cell => board.getBonus(cell) === Bonus.DoubleWord);
    const cellTriple = board.cells.find(cell => board.getBonus(cell) === Bonus.TripleWord);

    if (cellWithoutBonus !== undefined)
      test('returns 1 for cell w/out bonus', () => {
        expect(board.getMultiplierForWord(cellWithoutBonus)).toBe(1);
      });

    if (cellDouble !== undefined)
      test('returns greater than 1 for cell w/ double bonus', () => {
        expect(board.getMultiplierForWord(cellDouble)).toBeGreaterThan(1);
      });

    if (cellTriple !== undefined)
      test('returns greater than 1 for cell w/ triple bonus', () => {
        expect(board.getMultiplierForWord(cellTriple)).toBeGreaterThan(1);
      });

    if (cellWithoutBonus !== undefined && cellDouble !== undefined && cellTriple !== undefined)
      test('returns different values for cells w/ different bonuses', () => {
        expect(board.getMultiplierForWord(cellWithoutBonus)).not.toBe(board.getMultiplierForWord(cellDouble));
        expect(board.getMultiplierForWord(cellWithoutBonus)).not.toBe(board.getMultiplierForWord(cellTriple));
        expect(board.getMultiplierForWord(cellDouble)).not.toBe(board.getMultiplierForWord(cellTriple));
      });
  });

  describe('buildPlacement', () => {
    const inputCell = 112 as Cell;
    const inputTileA = 'A' as GameTile;
    const inputTileB = 'B' as GameTile;
    const inputTiles = [inputTileA, inputTileB];

    describe.each([
      { axis: Axis.X, step: 1 },
      { axis: Axis.Y, step: LayoutService.CELLS_PER_AXIS },
    ])('for $axis axis', ({ axis, step }) => {
      let board: Board;
      let placement: Placement;

      beforeEach(() => {
        board = Board.create(Type.Preset);
        board.placeTile(inputCell, inputTileA);
        board.placeTile((inputCell + step) as Cell, inputTileB);
        placement = board.buildPlacement({ axis, cell: inputCell }, inputTiles);
      });

      test('returns placement w/ cells on input axis', () => {
        const cellsPerAxis = LayoutService.CELLS_PER_AXIS;
        const cellsOffAxis = placement
          .map(({ cell }) => cell)
          .filter(cell =>
            axis === Axis.X
              ? Math.floor(cell / cellsPerAxis) !== Math.floor(inputCell / cellsPerAxis)
              : cell % cellsPerAxis !== inputCell % cellsPerAxis,
          );
        expect(cellsOffAxis).toEqual([]);
      });

      test('returns placement w/ previous adjacent link', () => {
        const previousCell = (inputCell - step) as Cell;
        const previousTile = 'C' as GameTile;
        board.placeTile(previousCell, previousTile);
        const newPlacement = board.buildPlacement({ axis, cell: inputCell }, inputTiles);
        const previousLinkIdx = newPlacement.findIndex(link => link.cell === previousCell && link.tile === previousTile);
        const firstInputLinkIdx = newPlacement.findIndex(link => link.tile === inputTileA);
        expect(previousLinkIdx).toBeGreaterThanOrEqual(0);
        expect(previousLinkIdx).toBeLessThan(firstInputLinkIdx);
      });

      test('returns placement w/ next adjacent link', () => {
        const nextCell = (inputCell + step * inputTiles.length) as Cell;
        const nextTile = 'C' as GameTile;
        board.placeTile(nextCell, nextTile);
        const newPlacement = board.buildPlacement({ axis, cell: inputCell }, inputTiles);
        const nextLinkIdx = newPlacement.findIndex(link => link.cell === nextCell && link.tile === nextTile);
        const lastInputLinkIdx = newPlacement.findIndex(link => link.tile === inputTileB);
        expect(nextLinkIdx).toBeGreaterThanOrEqual(0);
        expect(nextLinkIdx).toBeGreaterThan(lastInputLinkIdx);
      });

      test('returns placement w/ incrementing cells according to axis step', () => {
        const outputCells = placement.map(({ cell }) => cell);
        const [firstOutputCell] = outputCells;
        if (firstOutputCell === undefined) throw new ReferenceError('first output cell must be defined');
        const expectedOutputCells = outputCells.map((_, idx) => firstOutputCell + idx * step);
        expect(outputCells).toEqual(expectedOutputCells);
      });

      test('returns placement w/ all input tiles', () => {
        const outputTiles = placement.map(({ tile }) => tile);
        const missingInputTiles = inputTiles.filter(tile => !outputTiles.includes(tile));
        expect(missingInputTiles).toEqual([]);
      });

      test('returns placement w/ input cell', () => {
        expect(placement.map(({ cell }) => cell)).toContain(inputCell);
      });

      test('returns placement w/ all unique cells', () => {
        const outputCells = placement.map(({ cell }) => cell);
        expect(new Set(outputCells).size).toBe(outputCells.length);
      });

      test('returns placement w/ all unique tiles', () => {
        const outputTiles = placement.map(({ tile }) => tile);
        expect(new Set(outputTiles).size).toBe(outputTiles.length);
      });

      test('returns empty placement when no input tiles are placed', () => {
        const emptyBoard = Board.create(Type.Preset);
        expect(emptyBoard.buildPlacement({ axis, cell: inputCell }, inputTiles)).toEqual([]);
      });

      test('returns empty placement when input tiles are split into segments', () => {
        const splitBoard = Board.create(Type.Preset);
        splitBoard.placeTile(inputCell, inputTileA);
        splitBoard.placeTile((inputCell + step * 3) as Cell, inputTileB);
        expect(splitBoard.buildPlacement({ axis, cell: inputCell }, inputTiles)).toEqual([]);
      });

      test('returns empty placement when only some input tiles are placed', () => {
        const partialBoard = Board.create(Type.Preset);
        partialBoard.placeTile(inputCell, inputTileA);
        expect(partialBoard.buildPlacement({ axis, cell: inputCell }, inputTiles)).toEqual([]);
      });

      test('returns empty placement when input tiles are on opposite axis', () => {
        const otherStep = axis === Axis.X ? LayoutService.CELLS_PER_AXIS : 1;
        const otherAxisBoard = Board.create(Type.Preset);
        otherAxisBoard.placeTile(inputCell, inputTileA);
        otherAxisBoard.placeTile((inputCell + otherStep) as Cell, inputTileB);
        expect(otherAxisBoard.buildPlacement({ axis, cell: inputCell }, inputTiles)).toEqual([]);
      });

      test('excludes unrelated segment before targets', () => {
        const segmentBoard = Board.create(Type.Preset);
        const unrelatedTile = 'X' as GameTile;
        segmentBoard.placeTile((inputCell - step * 3) as Cell, unrelatedTile);
        segmentBoard.placeTile(inputCell, inputTileA);
        segmentBoard.placeTile((inputCell + step) as Cell, inputTileB);
        const newPlacement = segmentBoard.buildPlacement({ axis, cell: inputCell }, inputTiles);
        const tiles = newPlacement.map(({ tile }) => tile);
        expect(tiles).not.toContain(unrelatedTile);
        expect(tiles).toEqual([inputTileA, inputTileB]);
      });
    });
  });

  describe('placeTile', () => {
    const occupiedCell = 0 as Cell;
    const unoccupiedCell = 1 as Cell;
    const placedTile = 'A' as GameTile;
    const unplacedTile = 'B' as GameTile;
    let board: Board;

    beforeEach(() => {
      board = Board.create(Type.Preset);
      board.placeTile(occupiedCell, placedTile);
    });

    test('assigns unplaced tile to unoccupied cell', () => {
      board.placeTile(unoccupiedCell, unplacedTile);
      expect(board.findTileByCell(unoccupiedCell)).toBe(unplacedTile);
    });

    test('does not assign unplaced tile to occupied cell', () => {
      expect(() => {
        board.placeTile(occupiedCell, unplacedTile);
      }).toThrow();
    });

    test('does not assign placed tile to unoccupied cell', () => {
      expect(() => {
        board.placeTile(unoccupiedCell, placedTile);
      }).toThrow();
    });

    test('does not assign placed tile to occupied cell', () => {
      expect(() => {
        board.placeTile(occupiedCell, placedTile);
      }).toThrow();
    });
  });

  describe('undoPlaceTile', () => {
    const occupiedCell = 0 as Cell;
    const placedTile = 'A' as GameTile;
    const unplacedTile = 'B' as GameTile;
    let board: Board;

    beforeEach(() => {
      board = Board.create(Type.Preset);
      board.placeTile(occupiedCell, placedTile);
    });

    test('removes placed tile', () => {
      board.undoPlaceTile(placedTile);
      expect(board.findTileByCell(occupiedCell)).toBeUndefined();
      expect(board.findCellByTile(placedTile)).toBeUndefined();
    });

    test('does not remove unplaced tile', () => {
      expect(() => {
        board.undoPlaceTile(unplacedTile);
      }).toThrow();
    });

    test('allows new placement after placed tile removal', () => {
      board.undoPlaceTile(placedTile);
      board.placeTile(occupiedCell, unplacedTile);
      expect(board.findTileByCell(occupiedCell)).toBe(unplacedTile);
    });
  });

  describe('cells', () => {
    test('returns all cell indices in row-major order', () => {
      const board = Board.create(Type.Preset);
      expect(board.cells).toEqual(matrix.entries.map(entry => entry.cell));
    });
  });

  describe('cellsPerAxis', () => {
    const board = Board.create(Type.Preset);

    test('is greater than 0', () => {
      expect(board.cellsPerAxis).toBeGreaterThan(0);
    });

    test('is odd', () => {
      expect(board.cellsPerAxis % 2).not.toBe(0);
    });
  });

  describe.each(matrix.entries)('for $cell', ({ cell, column, row }) => {
    const board = Board.create(Type.Preset);

    describe('getAdjacentCells', () => {
      test('returns orthogonal neighbors', () => {
        const actual = board.getAdjacentCells(cell as Cell);
        const expected = matrix.getOrthogonalNeighbors(row, column);
        expect(actual).toEqual(expected);
      });
    });

    describe.each(Object.values(Axis))('for %s', axis => {
      describe('getAxisCells', () => {
        test('returns cells on input axis', () => {
          const actual = board.getAxisCells({ axis, cell: cell as Cell });
          const expected = matrix.getCollinearIndices(axis, row, column);
          expect(actual).toEqual(expected);
        });
      });
    });

    describe('getCellPositionInColumn', () => {
      test('returns column index', () => {
        expect(board.getCellPositionInColumn(cell as Cell)).toEqual(column);
      });
    });

    describe('getCellPositionInRow', () => {
      test('returns row index', () => {
        expect(board.getCellPositionInRow(cell as Cell)).toEqual(row);
      });
    });
  });

  describe('getOppositeAxis', () => {
    const board = Board.create(Type.Preset);

    test('returns Y for X', () => {
      expect(board.getOppositeAxis(Axis.X)).toBe(Axis.Y);
    });

    test('returns X for Y', () => {
      expect(board.getOppositeAxis(Axis.Y)).toBe(Axis.X);
    });
  });

  describe('isCellCenter', () => {
    const board = Board.create(Type.Preset);
    const centerCell = board.cells[Math.floor(board.cells.length / 2)];

    test('returns true for cell in middle of cells', () => {
      if (centerCell === undefined) throw new ReferenceError('expected center cell, got undefined');
      expect(board.isCellCenter(centerCell)).toBe(true);
    });

    test('returns false for non-center cell', () => {
      const nonCenterCell = board.cells.find(cell => cell !== centerCell);
      if (nonCenterCell === undefined) throw new ReferenceError('expected non-center cell, got undefined');
      expect(board.isCellCenter(nonCenterCell)).toBe(false);
    });
  });

  describe('isCellPositionAtAxisEnd', () => {
    const board = Board.create(Type.Preset);

    test('returns true for last position', () => {
      expect(board.isCellPositionAtAxisEnd(board.cellsPerAxis - 1)).toBe(true);
    });

    test('returns false for first position', () => {
      expect(board.isCellPositionAtAxisEnd(0)).toBe(false);
    });

    test('returns false for middle position', () => {
      expect(board.isCellPositionAtAxisEnd(Math.floor(board.cellsPerAxis / 2))).toBe(false);
    });
  });

  describe('isCellPositionAtAxisStart', () => {
    const board = Board.create(Type.Preset);

    test('returns true for first position', () => {
      expect(board.isCellPositionAtAxisStart(0)).toBe(true);
    });

    test('returns false for last position', () => {
      expect(board.isCellPositionAtAxisStart(board.cellsPerAxis - 1)).toBe(false);
    });

    test('returns false for middle position', () => {
      expect(board.isCellPositionAtAxisStart(Math.floor(board.cellsPerAxis / 2))).toBe(false);
    });
  });
});
