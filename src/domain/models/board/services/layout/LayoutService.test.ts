import Board from '@/domain/models/board/Board.ts';
import { Axis } from '@/domain/models/board/enums.ts';
import LayoutService from '@/domain/models/board/services/layout/LayoutService.ts';

describe('LayoutService', () => {
  const STEP_X = LayoutService.getAxisStep(Axis.X);
  const STEP_Y = LayoutService.getAxisStep(Axis.Y);

  it('calculates adjacent cells correctly', () => {
    Board.CELLS_BY_INDEX.forEach((cell, index) => {
      const edges = {
        bottom: LayoutService.isCellOnBottomEdge(cell),
        left: LayoutService.isCellOnLeftEdge(cell),
        right: LayoutService.isCellOnRightEdge(cell),
        top: LayoutService.isCellOnTopEdge(cell),
      };
      const adjacents = LayoutService.calculateAdjacentCells(cell);
      if (edges.top) expect(adjacents).not.toContain(index - STEP_Y);
      if (edges.bottom) expect(adjacents).not.toContain(index + STEP_Y);
      if (edges.left) expect(adjacents).not.toContain(index - STEP_X);
      if (edges.right) expect(adjacents).not.toContain(index + STEP_X);
      expect(adjacents).toHaveLength(4 - Object.values(edges).filter(Boolean).length);
    });
  });

  it('calculates axis cells correctly', () => {
    Board.CELLS_BY_INDEX.forEach(cell => {
      const axisCellsForX = LayoutService.calculateAxisCells({ axis: Axis.X, cell });
      const axisCellsForY = LayoutService.calculateAxisCells({ axis: Axis.Y, cell });
      expect(axisCellsForX).toHaveLength(LayoutService.CELLS_PER_AXIS);
      expect(axisCellsForY).toHaveLength(LayoutService.CELLS_PER_AXIS);
      expect(axisCellsForX).toBeRisingWithStep(STEP_X);
      expect(axisCellsForY).toBeRisingWithStep(STEP_Y);
    });
  });

  it('returns row position correctly', () => {
    // TODO getCellPositionInRow
  });

  it('returns column position correctly', () => {
    // TODO getCellPositionInColumn
  });

  it('returns axis start correctly', () => {
    // TODO isCellPositionAtAxisStart
  });

  it('returns axis end correctly', () => {
    // TODO isCellPositionAtAxisEnd
  });

  it('calculates bottom edge correctly', () => {
    // TODO isCellOnBottomEdge
  });

  it('calculates left edge correctly', () => {
    // TODO isCellOnLeftEdge
  });

  it('calculates right edge correctly', () => {
    // TODO isCellOnRightEdge
  });

  it('calculates top edge correctly', () => {
    // TODO isCellOnTopEdge
  });
});
