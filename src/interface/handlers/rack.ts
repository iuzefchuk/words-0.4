import { GameTile } from '@/application/types/index.ts';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';

export function handleClickRackCell(idx: number): void {
  const mainStore = MainStore.INSTANCE();
  const userStore = UserStore.INSTANCE();
  const tile = userStore.tiles[idx];
  if (tile === undefined) throw new ReferenceError(`expected tile at inventory index ${String(idx)}, got undefined`);
  const selected = userStore.selectedTile;
  if (selected === null) {
    if (mainStore.isTilePlaced(tile)) mainStore.undoPlaceTile(tile);
    return;
  }
  if (userStore.selectedTileIsPlaced) mainStore.undoPlaceTile(selected);
  userStore.switchTiles(selected, tile);
  userStore.deselectTile();
}

export function handleClickRackTile(tile: GameTile): void {
  const mainStore = MainStore.INSTANCE();
  const userStore = UserStore.INSTANCE();
  const selected = userStore.selectedTile;
  if (selected === null) {
    userStore.selectTile(tile);
    return;
  }
  if (!userStore.isTileSelected(tile)) {
    const selectedCell = mainStore.findCellWithTile(selected);
    if (selectedCell !== undefined) {
      mainStore.undoPlaceTile(selected);
      mainStore.placeTile({ cell: selectedCell, tile });
    }
    userStore.switchTiles(selected, tile);
  }
  userStore.deselectTile();
}
