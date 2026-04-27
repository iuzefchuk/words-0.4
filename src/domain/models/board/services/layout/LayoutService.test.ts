import { describe, expect, test } from 'vitest';
import { Axis } from '@/domain/models/board/enums.ts';
import LayoutService from '@/domain/models/board/services/layout/LayoutService.ts';
import { AnchorCoordinates, Cell } from '@/domain/models/board/types.ts';

// test skips isCellCenter, getOppositeAxis, isCellPositionAtAxisStart, isCellPositionAtAxisEnd —
// all are single-constant comparisons or 2-element enum mappings per the skip-trivial rule.

type CellNegativeCases = {
  readonly cell: Cell;
  readonly error: new (...args: Array<unknown>) => Error;
  readonly message?: RegExp | string;
};

type CellPositiveCases = {
  readonly adjacentCells: ReadonlyArray<Cell>;
  readonly cell: Cell;
  readonly column: number;
  readonly isBottomEdge: boolean;
  readonly isLeftEdge: boolean;
  readonly isRightEdge: boolean;
  readonly isTopEdge: boolean;
  readonly row: number;
};

type CoordsNegativeCases = {
  readonly coords: AnchorCoordinates;
  readonly error: new (...args: Array<unknown>) => Error;
  readonly message?: RegExp | string;
};

type CoordsPositiveCases = {
  readonly axisCells: ReadonlyArray<Cell>;
  readonly coords: AnchorCoordinates;
};

class LayoutServiceCases {
  static forCellNegative(): ReadonlyArray<CellNegativeCases> {
    return [
      {
        cell: LayoutService.CELLS_PER_LAYOUT as Cell,
        error: ReferenceError,
        message: /expected adjacent cells/,
      },
    ];
  }

  static forCellPositive(): ReadonlyArray<CellPositiveCases> {
    const matrix = this.buildIndexMatrix() as ReadonlyArray<ReadonlyArray<Cell>>;
    return matrix.flatMap((matrixRow, row) =>
      matrixRow.map((cell, column) => ({
        adjacentCells: this.getOrthogonalNeighbors(matrix, row, column),
        cell,
        column,
        isBottomEdge: row === matrix.length - 1,
        isLeftEdge: column === 0,
        isRightEdge: column === matrixRow.length - 1,
        isTopEdge: row === 0,
        row,
      })),
    );
  }

  static forCoordsNegative(): ReadonlyArray<CoordsNegativeCases> {
    return [
      {
        coords: { axis: 'Z' as Axis, cell: 0 as Cell },
        error: ReferenceError,
        message: /expected axis cells/,
      },
      {
        coords: { axis: Axis.X, cell: LayoutService.CELLS_PER_LAYOUT as Cell },
        error: ReferenceError,
        message: /expected axis line/,
      },
    ];
  }

  static forCoordsPositive(): ReadonlyArray<CoordsPositiveCases> {
    const matrix = this.buildIndexMatrix() as ReadonlyArray<ReadonlyArray<Cell>>;
    return matrix.flatMap(matrixRow =>
      matrixRow.flatMap((cell, column) => [
        { axisCells: matrixRow, coords: { axis: Axis.X, cell } },
        {
          axisCells: matrix.map(otherRow => {
            const columnCell = otherRow[column];
            if (columnCell === undefined) throw new ReferenceError('Cell must be defined');
            return columnCell;
          }),
          coords: { axis: Axis.Y, cell },
        },
      ]),
    );
  }

  private static buildIndexMatrix(): ReadonlyArray<ReadonlyArray<number>> {
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

  private static getOrthogonalNeighbors<T>(
    matrix: ReadonlyArray<ReadonlyArray<T>>,
    row: number,
    column: number,
  ): ReadonlyArray<T> {
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
}

describe('LayoutService', () => {
  describe.each(LayoutServiceCases.forCellNegative())('for invalid cell $cell', ({ cell, error, message }) => {
    test('getAdjacentCells throws', () => {
      const act = (): unknown => LayoutService.getAdjacentCells(cell);
      expect(act).toThrow(error);
      if (message !== undefined) expect(act).toThrow(message);
    });
  });

  describe.each(LayoutServiceCases.forCellPositive())(
    'for cell $cell',
    ({ adjacentCells, cell, column, isBottomEdge, isLeftEdge, isRightEdge, isTopEdge, row }) => {
      test('calculates adjacent cells', () => {
        expect(LayoutService.getAdjacentCells(cell)).toEqual(adjacentCells);
      });

      test('calculates column position', () => {
        expect(LayoutService.getCellPositionInColumn(cell)).toBe(column);
      });

      test('calculates is on bottom edge', () => {
        expect(LayoutService.isCellOnBottomEdge(cell)).toBe(isBottomEdge);
      });

      test('calculates is on left edge', () => {
        expect(LayoutService.isCellOnLeftEdge(cell)).toBe(isLeftEdge);
      });

      test('calculates is on right edge', () => {
        expect(LayoutService.isCellOnRightEdge(cell)).toBe(isRightEdge);
      });

      test('calculates is on top edge', () => {
        expect(LayoutService.isCellOnTopEdge(cell)).toBe(isTopEdge);
      });

      test('calculates row position', () => {
        expect(LayoutService.getCellPositionInRow(cell)).toBe(row);
      });
    },
  );

  describe.each(LayoutServiceCases.forCoordsPositive())(
    'for coords (axis $coords.axis, cell $coords.cell)',
    ({ axisCells, coords }) => {
      test('calculates axis cells', () => {
        expect(LayoutService.getAxisCells(coords)).toEqual(axisCells);
      });
    },
  );

  describe.each(LayoutServiceCases.forCoordsNegative())(
    'for invalid coords (axis $coords.axis, cell $coords.cell)',
    ({ coords, error, message }) => {
      test('getAxisCells throws', () => {
        const act = (): unknown => LayoutService.getAxisCells(coords);
        expect(act).toThrow(error);
        if (message !== undefined) expect(act).toThrow(message);
      });
    },
  );
});
