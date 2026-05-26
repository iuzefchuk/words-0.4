import { GameCell, GameTile } from '@/application/types/index.ts';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';

export function handleClickGridCell(cell: GameCell): void {
  const mainStore = MainStore.INSTANCE();
  const userStore = UserStore.INSTANCE();
  const selected = userStore.selectedTile;
  if (selected === null) return;
  if (mainStore.findTileOnCell(cell) !== undefined) return;
  if (userStore.selectedTileIsPlaced) mainStore.undoPlaceTile(selected);
  mainStore.placeTile({ cell, tile: selected });
  userStore.deselectTile();
}

export function handleClickGridTile(tile: GameTile): void {
  const mainStore = MainStore.INSTANCE();
  const userStore = UserStore.INSTANCE();
  if (!userStore.isTileInToolbar(tile)) return;
  if (userStore.isTileSelected(tile)) {
    userStore.deselectTile();
    return;
  }
  const selected = userStore.selectedTile;
  if (selected === null) {
    userStore.selectTile(tile);
    return;
  }
  const targetCell = mainStore.findCellWithTile(tile);
  if (targetCell === undefined) return;
  const selectedCell = mainStore.findCellWithTile(selected);
  if (selectedCell !== undefined) {
    mainStore.undoPlaceTile(selected);
    mainStore.undoPlaceTile(tile);
    mainStore.placeTile({ cell: selectedCell, tile });
    mainStore.placeTile({ cell: targetCell, tile: selected });
  } else {
    mainStore.undoPlaceTile(tile);
    mainStore.placeTile({ cell: targetCell, tile: selected });
    userStore.switchTiles(selected, tile);
  }
  userStore.deselectTile();
}

export function handleDoubleClickGridTile(tile: GameTile): void {
  const mainStore = MainStore.INSTANCE();
  const userStore = UserStore.INSTANCE();
  if (!userStore.isTileInToolbar(tile)) return;
  userStore.deselectTile();
  mainStore.undoPlaceTile(tile);
}
