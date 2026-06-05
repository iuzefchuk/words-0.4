import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
import type { GameCell, GameTile } from '@/app/types/index.ts';

export function handleDoublePressGridTile(tile: GameTile): void {
  const { undoPlaceTile } = MainStore.INSTANCE();
  const { deselectTile, isTileInToolbar } = UserStore.INSTANCE();
  if (!isTileInToolbar(tile)) return;
  deselectTile();
  undoPlaceTile(tile);
}

export function handlePressGridCell(cell: GameCell): void {
  const { findTileOnCell, placeTile, undoPlaceTile } = MainStore.INSTANCE();
  const { deselectTile, selectedTile, selectedTileIsPlaced } = UserStore.INSTANCE();
  if (selectedTile === null) return;
  if (findTileOnCell(cell) !== undefined) return;
  if (selectedTileIsPlaced) undoPlaceTile(selectedTile);
  placeTile({ cell, tile: selectedTile });
  deselectTile();
}

export function handlePressGridTile(tile: GameTile): void {
  const { findCellWithTile, placeTile, undoPlaceTile } = MainStore.INSTANCE();
  const { deselectTile, isTileInToolbar, isTileSelected, selectedTile, selectTile, switchTiles } = UserStore.INSTANCE();
  if (!isTileInToolbar(tile)) return;
  if (isTileSelected(tile)) {
    deselectTile();
    return;
  }
  if (selectedTile === null) {
    selectTile(tile);
    return;
  }
  const targetCell = findCellWithTile(tile);
  if (targetCell === undefined) return;
  const selectedCell = findCellWithTile(selectedTile);
  if (selectedCell !== undefined) {
    undoPlaceTile(selectedTile);
    undoPlaceTile(tile);
    placeTile({ cell: selectedCell, tile });
    placeTile({ cell: targetCell, tile: selectedTile });
  } else {
    undoPlaceTile(tile);
    placeTile({ cell: targetCell, tile: selectedTile });
    switchTiles(selectedTile, tile);
  }
  deselectTile();
}
