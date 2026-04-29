import { describe, expect, test } from 'vitest';
import { Axis } from '@/domain/models/board/enums.ts';
import LayoutService from '@/domain/models/board/services/layout/LayoutService.ts';
import { AnchorCoordinates, Cell } from '@/domain/models/board/types.ts';

describe('LayoutService', () => {
  let matrix = [] as ReadonlyArray<ReadonlyArray<number>>;

  beforeEach(() => {
    matrix = buildIndexMatrix();
  });

  afterEach(() => {
    matrix = [];
  });

  describe('CELLS_PER_AXIS value', () => {
    test('is greater than 0', () => {
      expect(LayoutService.CELLS_PER_AXIS).toBeGreaterThan(0);
    });
  });
  describe('DEFAULT_AXIS value', () => {
    test('to be an axis', () => {
      expect(LayoutService.DEFAULT_AXIS).toBeOneOf(Object.values(Axis));
    });
  });
  describe('getAdjacentCells method', () => {
    matrix.forEach((matrixRow, row) => {
      describe.each(matrixRow)('for $cell', (cell, column) => {
        test('returns geometrically expected values', () => {
          const actual = LayoutService.getAdjacentCells(cell as Cell);
          const expected = getOrthogonalNeighbors(matrix, row, column);
          expect(actual).toEqual(expected);
        });
      });
    });
  });
  describe('getAxisCells method', () => {
    matrix.forEach(matrixRow => {
      describe.each(matrixRow)('for $cell', (cell, column) => {
        describe.each(Object.values(Axis))('for $axis', axis => {
          const actual = LayoutService.getAxisCells({ axis, cell } as AnchorCoordinates);
          // TODO move this expected logic into IndexMatrix class when it's created
          let expected: ReadonlyArray<Cell>;
          if (axis === Axis.X) {
            expected = matrixRow as ReadonlyArray<Cell>;
          } else {
            expected = matrix.map(otherRow => {
              const columnCell = otherRow[column];
              if (columnCell === undefined) throw new ReferenceError('Cell must be defined');
              return columnCell as Cell;
            });
          }
          test('returns geometrically expected values', () => {
            expect(actual).toEqual(expected);
          });
        });
      });
    });
  });
  describe('getCellPositionInColumn method', () => {
    matrix.forEach(matrixRow => {
      describe.each(matrixRow)('for $cell', (cell, column) => {
        test('returns geometrically expected value', () => {
          expect(LayoutService.getCellPositionInColumn(cell as Cell)).toEqual(column);
        });
      });
    });
  });
  describe('getCellPositionInRow method', () => {
    matrix.forEach((matrixRow, row) => {
      describe.each(matrixRow)('for $cell', cell => {
        test('returns geometrically expected value', () => {
          expect(LayoutService.getCellPositionInRow(cell as Cell)).toEqual(row);
        });
      });
    });
  });
  describe('getOppositeAxis method', () => {
    describe.each(Object.values(Axis))('for $axis', axis => {
      test('returns axis', () => {
        expect(LayoutService.getOppositeAxis(axis)).toBeOneOf(Object.values(Axis));
      });
      test('returns axis that is different', () => {
        expect(LayoutService.getOppositeAxis(axis)).not.toBe(axis);
      });
    });
  });
  describe('isCellOnBottomEdge method', () => {
    matrix.forEach((matrixRow, row) => {
      describe.each(matrixRow)('for $cell', (cell, column) => {
        test('returns geometrically expected value', () => {
          const actual = LayoutService.isCellOnBottomEdge(cell as Cell);
          const expected = row === matrix.length - 1;
          expect(actual).toEqual(expected);
        });
      });
    });
  });
  describe('isCellOnLeftEdge method', () => {
    matrix.forEach((matrixRow, row) => {
      describe.each(matrixRow)('for $cell', (cell, column) => {
        test('returns geometrically expected value', () => {
          const actual = LayoutService.isCellOnLeftEdge(cell as Cell);
          const expected = column === 0;
          expect(actual).toEqual(expected);
        });
      });
    });
  });
  describe('isCellOnRightEdge method', () => {
    matrix.forEach((matrixRow, row) => {
      describe.each(matrixRow)('for $cell', (cell, column) => {
        test('returns geometrically expected value', () => {
          const actual = LayoutService.isCellOnRightEdge(cell as Cell);
          const expected = column === matrixRow.length - 1;
          expect(actual).toEqual(expected);
        });
      });
    });
  });
  describe('isCellOnTopEdge method', () => {
    matrix.forEach((matrixRow, row) => {
      describe.each(matrixRow)('for $cell', (cell, column) => {
        test('returns geometrically expected value', () => {
          const actual = LayoutService.isCellOnTopEdge(cell as Cell);
          const expected = row === 0;
          expect(actual).toEqual(expected);
        });
      });
    });
  });
});

// TODO create class IndexMatrix and encapsulate buildIndexMatrix & getOrthogonalNeighbors in there

function buildIndexMatrix(): ReadonlyArray<ReadonlyArray<number>> {
  return Array.from({ length: LayoutService.CELLS_PER_AXIS ** 2 }, (_, index) => index).reduce<Array<Array<number>>>(
    (rowsSoFar, index) => {
      const lastRow = rowsSoFar[rowsSoFar.length - 1];
      if (lastRow !== undefined && lastRow.length < LayoutService.CELLS_PER_AXIS) lastRow.push(index);
      else rowsSoFar.push([index]);
      return rowsSoFar;
    },
    [],
  );
}

function getOrthogonalNeighbors<T>(matrix: ReadonlyArray<ReadonlyArray<T>>, row: number, column: number): ReadonlyArray<T> {
  return [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]
    .map(([rowOffset, columnOffset]) => {
      if (rowOffset === undefined || columnOffset === undefined) {
        throw new ReferenceError('Offsets must be defined');
      }
      return matrix[row + rowOffset]?.[column + columnOffset];
    })
    .filter((neighbor): neighbor is T => neighbor !== undefined);
}
