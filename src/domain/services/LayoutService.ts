import { BoardAxis } from '@/domain/value-objects/enums.ts';
import type { BoardAnchorCoordinates, BoardCell } from '@/domain/value-objects/types.ts';

export default class LayoutService {
  static readonly CELLS_PER_AXIS = 15;

  static readonly CELLS: ReadonlyArray<BoardCell> = Array.from(
    { length: this.CELLS_PER_AXIS ** 2 },
    (_, idx) => idx as BoardCell,
  );

  static readonly CENTER_CELL = Math.floor(this.CELLS.length / 2) as BoardCell;

  static readonly DEFAULT_AXIS = BoardAxis.X;

  private static readonly AXIS_X_STEP = 1;

  private static readonly AXIS_Y_STEP = this.CELLS_PER_AXIS;

  private static readonly FIRST_CELL_POSITION = 0;

  private static readonly LAST_CELL_POSITION = this.CELLS_PER_AXIS - 1;

  private static readonly ADJACENTS_BY_CELL: ReadonlyMap<BoardCell, ReadonlyArray<BoardCell>> = (() => {
    const cache = new Map<BoardCell, ReadonlyArray<BoardCell>>();
    for (let cell = 0; cell < this.CELLS.length; cell++) {
      const col = this.getCellPositionInColumn(cell as BoardCell);
      const row = this.getCellPositionInRow(cell as BoardCell);
      const adjacents: Array<BoardCell> = [];
      if (col > this.FIRST_CELL_POSITION) adjacents.push((cell - this.AXIS_X_STEP) as BoardCell);
      if (col < this.LAST_CELL_POSITION) adjacents.push((cell + this.AXIS_X_STEP) as BoardCell);
      if (row > this.FIRST_CELL_POSITION) adjacents.push((cell - this.AXIS_Y_STEP) as BoardCell);
      if (row < this.LAST_CELL_POSITION) adjacents.push((cell + this.AXIS_Y_STEP) as BoardCell);
      cache.set(cell as BoardCell, adjacents);
    }
    return cache;
  })();

  private static readonly CELLS_BY_AXIS: ReadonlyMap<BoardAxis, ReadonlyArray<ReadonlyArray<BoardCell>>> = (() => {
    const cache = new Map<BoardAxis, ReadonlyArray<ReadonlyArray<BoardCell>>>();
    for (const axis of Object.values(BoardAxis)) {
      const lines: Array<ReadonlyArray<BoardCell>> = [];
      for (let lineIndex = 0; lineIndex < this.CELLS_PER_AXIS; lineIndex++) {
        const cells: Array<BoardCell> = [];
        for (let idx = 0; idx < this.CELLS_PER_AXIS; idx++) {
          cells.push(
            (axis === BoardAxis.X ? lineIndex * this.CELLS_PER_AXIS + idx : lineIndex + idx * this.CELLS_PER_AXIS) as BoardCell,
          );
        }
        lines.push(cells);
      }
      cache.set(axis, lines);
    }
    return cache;
  })();

  static getAdjacentCells(cell: BoardCell): ReadonlyArray<BoardCell> {
    const adjacentCells = this.ADJACENTS_BY_CELL.get(cell);
    if (adjacentCells === undefined) throw new ReferenceError(`expected adjacent cells for cell ${String(cell)}, got undefined`);
    return adjacentCells;
  }

  static getAxisCells(coords: BoardAnchorCoordinates): ReadonlyArray<BoardCell> {
    const { axis, cell } = coords;
    const cellPosition = axis === BoardAxis.X ? this.getCellPositionInRow(cell) : this.getCellPositionInColumn(cell);
    const axisCells = this.CELLS_BY_AXIS.get(axis);
    if (axisCells === undefined) throw new ReferenceError(`expected axis cells for axis ${axis}, got undefined`);
    const cells = axisCells[cellPosition];
    if (cells === undefined) throw new ReferenceError(`expected axis line at position ${String(cellPosition)}, got undefined`);
    return cells;
  }

  static getCellPositionInColumn(cell: BoardCell): number {
    return cell % this.CELLS_PER_AXIS;
  }

  static getCellPositionInRow(cell: BoardCell): number {
    return Math.floor(cell / this.CELLS_PER_AXIS);
  }

  static getOppositeAxis(axis: BoardAxis): BoardAxis {
    return axis === BoardAxis.X ? BoardAxis.Y : BoardAxis.X;
  }

  static isCellCenter(cell: BoardCell): boolean {
    return cell === this.CENTER_CELL;
  }

  static isCellPositionAtAxisEnd(position: number): boolean {
    return position === this.LAST_CELL_POSITION;
  }

  static isCellPositionAtAxisStart(position: number): boolean {
    return position === this.FIRST_CELL_POSITION;
  }
}
