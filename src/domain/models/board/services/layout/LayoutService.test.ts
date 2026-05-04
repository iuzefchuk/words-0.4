import { describe, expect, test } from 'vitest';
import { Axis } from '@/domain/models/board/enums.ts';
import LayoutService from '@/domain/models/board/services/layout/LayoutService.ts';
import { Cell } from '@/domain/models/board/types.ts';

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

  getAxisCells(axis: Axis, row: number, column: number): ReadonlyArray<number> {
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

describe('LayoutService', () => {
  const matrix = new IndexMatrix(LayoutService.CELLS_PER_AXIS);

  describe('CELLS_PER_AXIS', () => {
    test('is greater than 0', () => {
      expect(LayoutService.CELLS_PER_AXIS).toBeGreaterThan(0);
    });
    test('is odd', () => {
      expect(LayoutService.CELLS_PER_AXIS % 2).not.toBe(0);
    });
  });

  describe('CELLS', () => {
    test('has mathematically expected value', () => {
      expect(LayoutService.CELLS).toEqual(matrix.entries.map(entry => entry.cell));
    });
  });

  describe('CENTER_CELL', () => {
    test('is in middle of CELLS', () => {
      expect(LayoutService.CENTER_CELL).toBe(Math.floor(LayoutService.CELLS.length / 2));
    });
  });

  describe.each(matrix.entries)('for $cell', ({ cell, column, row }) => {
    describe('getAdjacentCells', () => {
      test('returns mathematically expected value', () => {
        const actual = LayoutService.getAdjacentCells(cell as Cell);
        const expected = matrix.getOrthogonalNeighbors(row, column);
        expect(actual).toEqual(expected);
      });
    });

    describe.each(Object.values(Axis))('for %s', axis => {
      describe('getAxisCells', () => {
        test('returns mathematically expected value', () => {
          const actual = LayoutService.getAxisCells({ axis, cell: cell as Cell });
          const expected = matrix.getAxisCells(axis, row, column);
          expect(actual).toEqual(expected);
        });
      });
    });

    describe('getCellPositionInColumn', () => {
      test('returns mathematically expected value', () => {
        expect(LayoutService.getCellPositionInColumn(cell as Cell)).toEqual(column);
      });
    });

    describe('getCellPositionInRow', () => {
      test('returns mathematically expected value', () => {
        expect(LayoutService.getCellPositionInRow(cell as Cell)).toEqual(row);
      });
    });

    describe('isCellOnBottomEdge', () => {
      test('returns mathematically expected value', () => {
        expect(LayoutService.isCellOnBottomEdge(cell as Cell)).toEqual(row === matrix.size - 1);
      });
    });

    describe('isCellOnLeftEdge', () => {
      test('returns mathematically expected value', () => {
        expect(LayoutService.isCellOnLeftEdge(cell as Cell)).toEqual(column === 0);
      });
    });

    describe('isCellOnRightEdge', () => {
      test('returns mathematically expected value', () => {
        expect(LayoutService.isCellOnRightEdge(cell as Cell)).toEqual(column === matrix.size - 1);
      });
    });

    describe('isCellOnTopEdge', () => {
      test('returns mathematically expected value', () => {
        expect(LayoutService.isCellOnTopEdge(cell as Cell)).toEqual(row === 0);
      });
    });
  });

  describe('getOppositeAxis', () => {
    describe.each(Object.values(Axis))('for %s', axis => {
      test('returns different axis', () => {
        expect(LayoutService.getOppositeAxis(axis)).not.toBe(axis);
      });
    });
  });

  describe('DEFAULT_AXIS', () => {
    // not covered
  });

  describe('isCellCenter', () => {
    // not covered
  });

  describe('isCellPositionAtAxisEnd', () => {
    // not covered
  });

  describe('isCellPositionAtAxisStart', () => {
    // not covered
  });
});
