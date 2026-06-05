import { computed } from 'vue';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
import type { GameCell, GameTile } from '@/app/types/index.ts';

type Bounds = { col: number; colSpan: number; row: number; rowSpan: number };

export default class UseOutline {
  readonly bounds = computed(() => UseOutline.computeBounds(this.userStore.tiles));

  private get mainStore(): ReturnType<typeof MainStore.INSTANCE> {
    return MainStore.INSTANCE();
  }

  private get userStore(): ReturnType<typeof UserStore.INSTANCE> {
    return UserStore.INSTANCE();
  }

  private static computeBounds(tiles: ReadonlyArray<GameTile>): ReadonlyArray<Bounds> {
    const cells = UseOutline.findCellsFor(tiles);
    if (cells.size === 0) return [];
    const visited = new Set<GameCell>();
    const bounds: Array<Bounds> = [];
    for (const cell of cells) {
      if (visited.has(cell)) continue;
      bounds.push(UseOutline.floodFillBounds(cell, cells, visited));
    }
    return bounds;
  }

  private static findCellsFor(tiles: ReadonlyArray<GameTile>): Set<GameCell> {
    const mainStore = MainStore.INSTANCE();
    const cells = new Set<GameCell>();
    for (const tile of tiles) {
      const cell = mainStore.findCellWithTile(tile);
      if (cell !== undefined) cells.add(cell);
    }
    return cells;
  }

  private static floodFillBounds(start: GameCell, cells: ReadonlySet<GameCell>, visited: Set<GameCell>): Bounds {
    const mainStore = MainStore.INSTANCE();
    const stack: Array<GameCell> = [start];
    visited.add(start);
    let minRow = Infinity;
    let maxRow = -Infinity;
    let minCol = Infinity;
    let maxCol = -Infinity;
    while (stack.length > 0) {
      const cell = stack.pop();
      if (cell === undefined) throw new ReferenceError('expected cell from traversal stack, got undefined');
      const row = mainStore.getCellRowIndex(cell);
      const col = mainStore.getCellColumnIndex(cell);
      if (row < minRow) minRow = row;
      if (row > maxRow) maxRow = row;
      if (col < minCol) minCol = col;
      if (col > maxCol) maxCol = col;
      for (const adjacent of mainStore.getAdjacentCells(cell)) {
        if (!cells.has(adjacent) || visited.has(adjacent)) continue;
        visited.add(adjacent);
        stack.push(adjacent);
      }
    }
    return { col: minCol, colSpan: maxCol - minCol + 1, row: minRow, rowSpan: maxRow - minRow + 1 };
  }

  readonly isAnchorAt = (idx: number): boolean => {
    if (this.mainStore.currentTurnScore === undefined) return false;
    let minRow = Infinity;
    let anchorIdx = -1;
    let rightmostEdge = -Infinity;
    const bounds = this.bounds.value;
    for (let cursor = 0; cursor < bounds.length; cursor++) {
      const group = bounds[cursor];
      if (group === undefined) throw new ReferenceError(`expected bounds at index ${String(cursor)}, got undefined`);
      if (group.row < minRow) {
        minRow = group.row;
        anchorIdx = cursor;
        rightmostEdge = group.col + group.colSpan;
      } else if (group.row === minRow) {
        const edge = group.col + group.colSpan;
        if (edge > rightmostEdge) {
          anchorIdx = cursor;
          rightmostEdge = edge;
        }
      }
    }
    return idx === anchorIdx;
  };

  readonly isOnRightmostColumnAt = (idx: number): boolean => {
    const group = this.bounds.value[idx];
    if (group === undefined) return false;
    return group.col + group.colSpan >= this.mainStore.boardCellsPerAxis;
  };
}
