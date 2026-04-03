import type { CellIndex, Link } from '@/domain/models/Board.ts';
import type { TileId } from '@/domain/models/Inventory.ts';

export function createCellIndex(n: number): CellIndex {
  return n as CellIndex;
}

export function createLink(c: number, t: string): Link {
  return { cell: createCellIndex(c), tile: createTileId(t) };
}

export function createTileId(s: string): TileId {
  return s as TileId;
}
