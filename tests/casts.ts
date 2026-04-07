import type { CellIndex, Link } from '@/domain/models/board/Board.ts';
import type { TileId } from '@/domain/models/inventory/Inventory.ts';

export function castCellIndex(number: number): CellIndex {
  return number as CellIndex;
}

export function castLink(cell: number, tile: string): Link {
  return { cell: castCellIndex(cell), tile: castTileId(tile) };
}

export function castTileId(string: string): TileId {
  return string as TileId;
}
