import { GameCell, GameTile } from '@/application/types/index.ts';
import MainStore from '@/presentation/stores/MainStore.ts';

type OutlineGroup = { col: number; colSpan: number; row: number; rowSpan: number };

export default class UseOutline {
  private get mainStore() {
    return MainStore.INSTANCE();
  }

  createGroups(tiles: ReadonlyArray<GameTile>): ReadonlyArray<OutlineGroup> {
    const cells = this.collectCells(tiles);
    if (cells.size === 0) return [];
    const visited = new Set<GameCell>();
    const groups: Array<OutlineGroup> = [];
    for (const cell of cells) {
      if (visited.has(cell)) continue;
      groups.push(this.buildGroup(cell, cells, visited));
    }
    return groups;
  }

  isTooltipFlipped(groups: ReadonlyArray<OutlineGroup>, idx: number): boolean {
    const group = groups[idx];
    if (!group) return false;
    return group.col + group.colSpan >= this.mainStore.boardCellsPerAxis;
  }

  isTooltipRendered(groups: ReadonlyArray<OutlineGroup>, idx: number): boolean {
    if (this.mainStore.currentTurnScore === undefined) return false;
    const minRow = Math.min(...groups.map(g => g.row));
    const topRowGroups = groups.map((g, i) => ({ g, i })).filter(({ g }) => g.row === minRow);
    const rightmost = topRowGroups.reduce((a, b) => (a.g.col + a.g.colSpan > b.g.col + b.g.colSpan ? a : b));
    return idx === rightmost.i;
  }

  private buildGroup(start: GameCell, cells: ReadonlySet<GameCell>, visited: Set<GameCell>): OutlineGroup {
    const stack: Array<GameCell> = [start];
    visited.add(start);
    let minRow = Infinity;
    let maxRow = -Infinity;
    let minCol = Infinity;
    let maxCol = -Infinity;
    while (stack.length > 0) {
      const cell = stack.pop()!;
      const row = this.mainStore.getCellRowIndex(cell);
      const col = this.mainStore.getCellColumnIndex(cell);
      if (row < minRow) minRow = row;
      if (row > maxRow) maxRow = row;
      if (col < minCol) minCol = col;
      if (col > maxCol) maxCol = col;
      for (const adjacent of this.mainStore.calculateAdjacentCells(cell)) {
        if (!cells.has(adjacent) || visited.has(adjacent)) continue;
        visited.add(adjacent);
        stack.push(adjacent);
      }
    }
    return { col: minCol, colSpan: maxCol - minCol + 1, row: minRow, rowSpan: maxRow - minRow + 1 };
  }

  private collectCells(tiles: ReadonlyArray<GameTile>): Set<GameCell> {
    const cells = new Set<GameCell>();
    for (const tile of tiles) {
      const cell = this.mainStore.findCellWithTile(tile);
      if (cell !== undefined) cells.add(cell);
    }
    return cells;
  }
}
