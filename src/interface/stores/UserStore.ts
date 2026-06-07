import { defineStore } from 'pinia';
import { computed, ref, shallowRef, triggerRef } from 'vue';
import MainStore from '@/interface/stores/MainStore.ts';
import type { DomainInventoryTile } from '@/app/types/index.ts';

export default class UserStore {
  static readonly INSTANCE = defineStore('user', () => {
    const store = new UserStore();
    const mainStore = MainStore.INSTANCE();
    store.initialize(mainStore.userTiles);
    return {
      deselectTile: store.deselectTile.bind(store),
      initialize: () => {
        store.initialize(mainStore.userTiles);
      },
      isTileInToolbar: store.isTileInToolbar.bind(store),
      isTileSelected: store.isTileSelected.bind(store),
      selectedTile: computed(() => store.selectedTile),
      selectedTileIsPlaced: computed(() => store.selectedTileIsPlaced),
      selectTile: store.selectTile.bind(store),
      shuffleTiles: () => {
        store.shuffleTiles();
      },
      switchTiles: (firstTile: DomainInventoryTile, secondTile: DomainInventoryTile) => {
        store.switchTiles(firstTile, secondTile);
      },
      tiles: store.tilesRef,
    };
  });

  private get mainStore(): ReturnType<typeof MainStore.INSTANCE> {
    return MainStore.INSTANCE();
  }

  private get selectedTile(): DomainInventoryTile | null {
    return this.selectedTileRef.value;
  }

  private get selectedTileIsPlaced(): boolean {
    return this.selectedTile !== null && this.mainStore.isTilePlaced(this.selectedTile);
  }

  private get tiles(): Array<DomainInventoryTile> {
    return this.tilesRef.value;
  }

  private set tiles(newValue: Array<DomainInventoryTile>) {
    this.tilesRef.value = newValue;
  }

  private constructor(
    private readonly tilesRef = shallowRef<Array<DomainInventoryTile>>([]),
    private readonly selectedTileRef = ref<DomainInventoryTile | null>(null),
  ) {}

  private deselectTile(): void {
    this.selectedTileRef.value = null;
  }

  private getTileIdx(tile: DomainInventoryTile): number {
    return this.tiles.indexOf(tile);
  }

  private initialize(userTiles: ReadonlyArray<DomainInventoryTile>): void {
    this.tiles.splice(0, this.tiles.length, ...userTiles);
    triggerRef(this.tilesRef);
    this.selectedTileRef.value = null;
  }

  private isTileInToolbar(tile: DomainInventoryTile): boolean {
    return this.getTileIdx(tile) !== -1;
  }

  private isTileSelected(tile: DomainInventoryTile): boolean {
    return this.selectedTile !== null && this.mainStore.areTilesSame(this.selectedTile, tile);
  }

  private selectTile(tile: DomainInventoryTile): void {
    if (!this.isTileInToolbar(tile)) return;
    this.selectedTileRef.value = tile;
  }

  private shuffleTiles(): void {
    this.mainStore.shuffleUserTiles(this.tiles);
    triggerRef(this.tilesRef);
  }

  private switchTiles(firstTile: DomainInventoryTile, secondTile: DomainInventoryTile): void {
    const firstIdx = this.getTileIdx(firstTile);
    const secondIdx = this.getTileIdx(secondTile);
    if (firstIdx < 0 || secondIdx < 0) throw new Error(`cannot switch tiles: ${firstTile} or ${secondTile} is not in inventory`);
    const first = this.tiles[firstIdx];
    const second = this.tiles[secondIdx];
    if (first === undefined || second === undefined) {
      throw new Error(`expected tiles at indices ${String(firstIdx)} and ${String(secondIdx)}, got undefined`);
    }
    this.tiles[firstIdx] = second;
    this.tiles[secondIdx] = first;
    triggerRef(this.tilesRef);
  }
}
