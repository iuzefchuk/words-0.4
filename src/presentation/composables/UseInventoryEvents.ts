import { GameCell, GameTile } from '@/domain/types/index.ts';
import InventoryStore from '@/presentation/stores/InventoryStore.ts';
import MainStore from '@/presentation/stores/MainStore.ts';

export default class UseInventoryEvents {
  get selectedTile(): GameTile | null {
    return this.inventoryStore.selectedTile;
  }

  private get inventoryStore() {
    return InventoryStore.INSTANCE();
  }

  private get mainStore() {
    return MainStore.INSTANCE();
  }

  private get selectedTileIsPlaced(): boolean {
    return this.inventoryStore.selectedTileIsPlaced;
  }

  handleClickBoardCell(cell: GameCell): void {
    if (!this.selectedTile) return;
    const existingTile = this.mainStore.findTileOnCell(cell);
    if (existingTile) return;
    if (this.selectedTileIsPlaced) this.mainStore.undoPlaceTile(this.selectedTile);
    this.mainStore.placeTile({ cell, tile: this.selectedTile });
    this.inventoryStore.deselectTile();
  }

  handleClickBoardTile(tile: GameTile): void {
    if (!this.inventoryStore.isTileInRack(tile)) return;
    if (this.inventoryStore.isTileSelected(tile)) {
      this.inventoryStore.deselectTile();
      return;
    }
    if (!this.selectedTile) {
      this.inventoryStore.selectedTile = tile; // TODO internalize selectedTile in InventoryStore
      return;
    }
    const tileCell = this.mainStore.findCellWithTile(tile);
    if (!tileCell) return;
    const selectedCell = this.mainStore.findCellWithTile(this.selectedTile);
    if (selectedCell) {
      this.mainStore.undoPlaceTile(this.selectedTile);
      this.mainStore.undoPlaceTile(tile);
      this.mainStore.placeTile({ cell: selectedCell, tile });
      this.mainStore.placeTile({ cell: tileCell, tile: this.selectedTile });
    } else {
      this.mainStore.undoPlaceTile(tile);
      this.mainStore.placeTile({ cell: tileCell, tile: this.selectedTile });
      this.inventoryStore.switchTiles(this.selectedTile, tile);
    }
    this.inventoryStore.deselectTile();
  }

  handleClickFooterCell(idx: number): void {
    const tile = this.inventoryStore.tiles[idx];
    if (tile === undefined) throw new ReferenceError('Tile must ne defined');
    if (!this.selectedTile) {
      if (this.mainStore.isTilePlaced(tile)) this.mainStore.undoPlaceTile(tile);
      return;
    }
    if (this.selectedTileIsPlaced) this.mainStore.undoPlaceTile(this.selectedTile);
    this.inventoryStore.switchTiles(this.selectedTile, tile);
    this.inventoryStore.deselectTile();
  }

  handleClickFooterTile(tile: GameTile): void {
    if (!this.selectedTile) {
      this.inventoryStore.selectedTile = tile; // TODO internalize selectedTile in InventoryStore
      return;
    }
    if (!this.inventoryStore.isTileSelected(tile)) {
      const selectedCell = this.mainStore.findCellWithTile(this.selectedTile);
      if (selectedCell) {
        this.mainStore.undoPlaceTile(this.selectedTile);
        this.mainStore.placeTile({ cell: selectedCell, tile });
      }
      this.inventoryStore.switchTiles(this.selectedTile, tile);
    }
    this.inventoryStore.deselectTile();
  }

  handleDoubleClickBoardTile(tile: GameTile): void {
    if (!this.inventoryStore.isTileInRack(tile)) return;
    this.inventoryStore.deselectTile();
    this.mainStore.undoPlaceTile(tile);
  }
}
