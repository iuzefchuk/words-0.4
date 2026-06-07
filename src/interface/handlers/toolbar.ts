import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
import type { DomainInventoryTile } from '@/app/types/index.ts';

export function handlePressToolbarCell(idx: number): void {
  const { isTilePlaced, undoPlaceTile } = MainStore.INSTANCE();
  const { deselectTile, selectedTile, selectedTileIsPlaced, switchTiles, tiles } = UserStore.INSTANCE();
  const tile = tiles[idx];
  if (tile === undefined) throw new ReferenceError(`expected tile at inventory index ${String(idx)}, got undefined`);
  if (selectedTile === null) {
    if (isTilePlaced(tile)) undoPlaceTile(tile);
    return;
  }
  if (selectedTileIsPlaced) undoPlaceTile(selectedTile);
  switchTiles(selectedTile, tile);
  deselectTile();
}

export function handlePressToolbarTile(tile: DomainInventoryTile): void {
  const { findCellWithTile, placeTile, undoPlaceTile } = MainStore.INSTANCE();
  const { deselectTile, isTileSelected, selectedTile, selectTile, switchTiles } = UserStore.INSTANCE();
  if (selectedTile === null) {
    selectTile(tile);
    return;
  }
  if (!isTileSelected(tile)) {
    const selectedCell = findCellWithTile(selectedTile);
    if (selectedCell !== undefined) {
      undoPlaceTile(selectedTile);
      placeTile({ cell: selectedCell, tile });
    }
    switchTiles(selectedTile, tile);
  }
  deselectTile();
}
