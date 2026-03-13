import { Axis, CellIndex } from '@/domain/board/types.ts';
import { Board } from '@/domain/board/types.ts';

export default class AxisResolver {
  private static readonly defaultAxis = Axis.X;

  static execute(board: Board, args: { cellSequence: ReadonlyArray<CellIndex> }): Axis {
    const { cellSequence } = args;
    let normalizedSequence = cellSequence;
    if (cellSequence.length === 1) {
      const [firstCell] = cellSequence;
      const connectedAdjacents = board.getAdjacentCells(firstCell).filter(cell => board.isCellOccupied(cell));
      normalizedSequence = connectedAdjacents.length === 0 ? [] : [connectedAdjacents[0], firstCell];
    }
    if (normalizedSequence.length === 0) return this.defaultAxis;
    const [firstIndex] = normalizedSequence;
    const firstColumn = board.getColumnIndex(firstIndex);
    const isVertical = normalizedSequence.every(cell => board.getColumnIndex(cell) === firstColumn);
    return isVertical ? Axis.Y : Axis.X;
  }
}
