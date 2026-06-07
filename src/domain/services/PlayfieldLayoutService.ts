import { PlayfieldAxis } from '@/domain/value-objects/enums.ts';
import type { PlayfieldAnchorCoordinates, PlayfieldCell } from '@/domain/value-objects/types.ts';

export default class PlayfieldLayoutService {
  static readonly CELLS_PER_AXIS = 15;

  static readonly CELLS: ReadonlyArray<PlayfieldCell> = Array.from(
    { length: this.CELLS_PER_AXIS ** 2 },
    (_, idx) => idx as PlayfieldCell,
  );

  static readonly CENTER_CELL = Math.floor(this.CELLS.length / 2) as PlayfieldCell;

  static readonly DEFAULT_AXIS = PlayfieldAxis.X;

  private static readonly AXIS_X_STEP = 1;

  private static readonly AXIS_Y_STEP = this.CELLS_PER_AXIS;

  private static readonly FIRST_CELL_POSITION = 0;

  private static readonly LAST_CELL_POSITION = this.CELLS_PER_AXIS - 1;

  private static readonly ADJACENTS_BY_CELL: ReadonlyMap<PlayfieldCell, ReadonlyArray<PlayfieldCell>> = (() => {
    const cache = new Map<PlayfieldCell, ReadonlyArray<PlayfieldCell>>();
    for (let cell = 0; cell < this.CELLS.length; cell++) {
      const col = this.getCellPositionInColumn(cell as PlayfieldCell);
      const row = this.getCellPositionInRow(cell as PlayfieldCell);
      const adjacents: Array<PlayfieldCell> = [];
      if (col > this.FIRST_CELL_POSITION) adjacents.push((cell - this.AXIS_X_STEP) as PlayfieldCell);
      if (col < this.LAST_CELL_POSITION) adjacents.push((cell + this.AXIS_X_STEP) as PlayfieldCell);
      if (row > this.FIRST_CELL_POSITION) adjacents.push((cell - this.AXIS_Y_STEP) as PlayfieldCell);
      if (row < this.LAST_CELL_POSITION) adjacents.push((cell + this.AXIS_Y_STEP) as PlayfieldCell);
      cache.set(cell as PlayfieldCell, adjacents);
    }
    return cache;
  })();

  private static readonly CELLS_BY_AXIS: ReadonlyMap<PlayfieldAxis, ReadonlyArray<ReadonlyArray<PlayfieldCell>>> = (() => {
    const cache = new Map<PlayfieldAxis, ReadonlyArray<ReadonlyArray<PlayfieldCell>>>();
    for (const axis of Object.values(PlayfieldAxis)) {
      const lines: Array<ReadonlyArray<PlayfieldCell>> = [];
      for (let lineIndex = 0; lineIndex < this.CELLS_PER_AXIS; lineIndex++) {
        const cells: Array<PlayfieldCell> = [];
        for (let idx = 0; idx < this.CELLS_PER_AXIS; idx++) {
          cells.push(
            (axis === PlayfieldAxis.X
              ? lineIndex * this.CELLS_PER_AXIS + idx
              : lineIndex + idx * this.CELLS_PER_AXIS) as PlayfieldCell,
          );
        }
        lines.push(cells);
      }
      cache.set(axis, lines);
    }
    return cache;
  })();

  static getAdjacentCells(cell: PlayfieldCell): ReadonlyArray<PlayfieldCell> {
    const adjacentCells = this.ADJACENTS_BY_CELL.get(cell);
    if (adjacentCells === undefined) throw new ReferenceError(`expected adjacent cells for cell ${String(cell)}, got undefined`);
    return adjacentCells;
  }

  static getAxisCells(coords: PlayfieldAnchorCoordinates): ReadonlyArray<PlayfieldCell> {
    const { axis, cell } = coords;
    const cellPosition = axis === PlayfieldAxis.X ? this.getCellPositionInRow(cell) : this.getCellPositionInColumn(cell);
    const axisCells = this.CELLS_BY_AXIS.get(axis);
    if (axisCells === undefined) throw new ReferenceError(`expected axis cells for axis ${axis}, got undefined`);
    const cells = axisCells[cellPosition];
    if (cells === undefined) throw new ReferenceError(`expected axis line at position ${String(cellPosition)}, got undefined`);
    return cells;
  }

  static getCellPositionInColumn(cell: PlayfieldCell): number {
    return cell % this.CELLS_PER_AXIS;
  }

  static getCellPositionInRow(cell: PlayfieldCell): number {
    return Math.floor(cell / this.CELLS_PER_AXIS);
  }

  static getOppositeAxis(axis: PlayfieldAxis): PlayfieldAxis {
    return axis === PlayfieldAxis.X ? PlayfieldAxis.Y : PlayfieldAxis.X;
  }

  static isCellCenter(cell: PlayfieldCell): boolean {
    return cell === this.CENTER_CELL;
  }

  static isCellPositionAtAxisEnd(position: number): boolean {
    return position === this.LAST_CELL_POSITION;
  }

  static isCellPositionAtAxisStart(position: number): boolean {
    return position === this.FIRST_CELL_POSITION;
  }
}
