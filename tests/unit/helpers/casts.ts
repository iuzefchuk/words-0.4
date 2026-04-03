import type { CellIndex, Link } from '@/domain/models/Board.ts';
import type { TileId } from '@/domain/models/Inventory.ts';

export function createCellIndex(number: number): CellIndex {
  return number as CellIndex;
}

export function createLink(cell: number, tile: string): Link {
  return { cell: createCellIndex(cell), tile: createTileId(tile) };
}

export function createTileId(string: string): TileId {
  return string as TileId;
}
