import ShuffleService from '@/domain/services/ShuffleService.ts';
import { InventoryLetter, InventoryStockStage } from '@/domain/value-objects/enums.ts';
import type { MatchPlayer } from '@/domain/value-objects/enums.ts';
import type { InventoryStockPoolKey, InventoryTile, InventoryTileCollection } from '@/domain/value-objects/types.ts';

class LetterService {
  private static readonly LETTER_CONFIG: Record<InventoryLetter, { count: number; points: number }> = {
    [InventoryLetter.A]: { count: 9, points: 1 },
    [InventoryLetter.B]: { count: 2, points: 4 },
    [InventoryLetter.C]: { count: 2, points: 4 },
    [InventoryLetter.D]: { count: 4, points: 2 },
    [InventoryLetter.E]: { count: 12, points: 1 },
    [InventoryLetter.F]: { count: 2, points: 4 },
    [InventoryLetter.G]: { count: 3, points: 3 },
    [InventoryLetter.H]: { count: 2, points: 4 },
    [InventoryLetter.I]: { count: 9, points: 1 },
    [InventoryLetter.J]: { count: 1, points: 10 },
    [InventoryLetter.K]: { count: 1, points: 5 },
    [InventoryLetter.L]: { count: 4, points: 1 },
    [InventoryLetter.M]: { count: 2, points: 3 },
    [InventoryLetter.N]: { count: 6, points: 1 },
    [InventoryLetter.O]: { count: 8, points: 1 },
    [InventoryLetter.P]: { count: 2, points: 4 },
    [InventoryLetter.Q]: { count: 1, points: 10 },
    [InventoryLetter.R]: { count: 6, points: 1 },
    [InventoryLetter.S]: { count: 4, points: 1 },
    [InventoryLetter.T]: { count: 6, points: 1 },
    [InventoryLetter.U]: { count: 4, points: 2 },
    [InventoryLetter.V]: { count: 2, points: 4 },
    [InventoryLetter.W]: { count: 2, points: 4 },
    [InventoryLetter.X]: { count: 1, points: 8 },
    [InventoryLetter.Y]: { count: 2, points: 4 },
    [InventoryLetter.Z]: { count: 1, points: 10 },
  };

  private static readonly LETTER_BY_TILE: ReadonlyMap<InventoryTile, InventoryLetter> = new Map(
    Object.values(InventoryLetter).flatMap(letter =>
      Array.from({ length: LetterService.LETTER_CONFIG[letter].count }, (_, idx) => {
        const tile = `${letter}-${String(idx)}` as InventoryTile;
        return [tile, letter] as const;
      }),
    ),
  );

  static getAllTiles(): Array<InventoryTile> {
    return [...LetterService.LETTER_BY_TILE.keys()];
  }

  static getLetterPoints(letter: InventoryLetter): number {
    return LetterService.LETTER_CONFIG[letter].points;
  }

  static getTileLetter(tile: InventoryTile): InventoryLetter {
    const letter = LetterService.LETTER_BY_TILE.get(tile);
    if (letter === undefined) throw new ReferenceError(`expected letter for tile ${tile}, got undefined`);
    return letter;
  }
}

class Pool<Item = unknown> {
  get itemCount(): number {
    return this.items.length;
  }

  get itemsProjection(): ReadonlyArray<Item> {
    return this.items;
  }

  private constructor(
    private readonly items: Array<Item>,
    public readonly capacity = Infinity,
  ) {}

  static clone<Item>(source: Pool<Item>): Pool<Item> {
    return new Pool([...source.items], source.capacity);
  }

  static create<Item>(items: Array<Item> = [], capacity?: number): Pool<Item> {
    return new Pool(items, capacity);
  }

  addItem(item: Item): void {
    if (this.items.includes(item)) throw new Error(`item ${String(item)} is already in pool`);
    if (this.items.length + 1 > this.capacity) {
      throw new Error(`cannot add item: pool capacity ${String(this.capacity)} exceeded`);
    }
    this.items.push(item);
  }

  removeItem(item: Item): Item {
    const index = this.items.indexOf(item);
    if (index === -1) throw new ReferenceError(`item ${String(item)} is not in pool`);
    const [removedItem] = this.items.splice(index, 1);
    if (removedItem === undefined) throw new ReferenceError(`item ${String(item)} is not in pool`);
    return removedItem;
  }

  removeLastItem(): Item {
    const item = this.items.pop();
    if (item === undefined) throw new Error('cannot pop item: pool is empty');
    return item;
  }

  shuffleItems(): void {
    ShuffleService.shuffle({ array: this.items });
  }
}

class Stock<Item = unknown, Stage = string, Owner = null | string> {
  private constructor(
    public readonly owners: ReadonlyArray<Owner>,
    public readonly stages: ReadonlyArray<Stage>,
    private readonly pools: ReadonlyMap<Stage, ReadonlyMap<Owner, Pool<Item>>>,
  ) {}

  static clone<Item, Stage, Owner>(source: Stock<Item, Stage, Owner>): Stock<Item, Stage, Owner> {
    const pools = new Map(
      [...source.pools].map(
        ([stage, ownerMap]) =>
          [stage, new Map([...ownerMap].map(([owner, pool]) => [owner, Pool.clone(pool)] as const))] as const,
      ),
    );
    return new Stock([...source.owners], [...source.stages], pools);
  }

  static create<Item, Stage, Owner>(
    stages: ReadonlyArray<Stage>,
    items: Array<Item>,
    owners: ReadonlyArray<Owner>,
    poolCapacity: ReadonlyMap<Stage, number>,
  ): Stock<Item, Stage, Owner> {
    const firstStage = stages.at(0);
    const ownerKeys: ReadonlyArray<Owner> = [null as Owner, ...owners];
    const pools = Stock.buildPools(stages, ownerKeys, (stage, key) =>
      Pool.create(stage === firstStage && key === null ? items : [], poolCapacity.get(stage)),
    );
    return new Stock([...owners], [...stages], pools);
  }

  private static buildPools<Item, Stage, Owner>(
    stages: ReadonlyArray<Stage>,
    ownerKeys: ReadonlyArray<Owner>,
    createPool: (stage: Stage, key: Owner) => Pool<Item>,
  ): ReadonlyMap<Stage, ReadonlyMap<Owner, Pool<Item>>> {
    return new Map(
      stages.map(stage => [stage, new Map<Owner, Pool<Item>>(ownerKeys.map(key => [key, createPool(stage, key)]))] as const),
    );
  }

  advanceItemStage(item: Item, owner?: Owner): void {
    const from = this.findKeyByItem(item);
    const to: InventoryStockPoolKey<Stage, Owner> = { owner: owner ?? (null as Owner), stage: this.getNextStage(from.stage) };
    this.findPoolByKey(from).removeItem(item);
    this.findPoolByKey(to).addItem(item);
  }

  getPoolItemsProjection(key: InventoryStockPoolKey<Stage, Owner>): ReadonlyArray<Item> {
    return this.findPoolByKey(key).itemsProjection;
  }

  shufflePool(key: InventoryStockPoolKey<Stage, Owner>): void {
    this.findPoolByKey(key).shuffleItems();
  }

  private findKeyByItem(item: Item): InventoryStockPoolKey<Stage, Owner> {
    for (const [stage, ownerMap] of this.pools) {
      for (const [owner, pool] of ownerMap) {
        if (pool.itemsProjection.includes(item)) return { owner, stage };
      }
    }
    throw new ReferenceError(`item ${String(item)} is not in any stage`);
  }

  private findPoolByKey(key: InventoryStockPoolKey<Stage, Owner>): Pool<Item> {
    const { owner, stage } = key;
    const ownerMap = this.pools.get(stage);
    if (ownerMap === undefined) throw new ReferenceError(`expected owner map for stage ${String(stage)}, got undefined`);
    const pool = ownerMap.get(owner);
    if (pool === undefined)
      throw new ReferenceError(`expected pool for stage ${String(stage)} and owner ${String(owner)}, got undefined`);
    return pool;
  }

  private getNextStage(stage: Stage): Stage {
    const index = this.stages.indexOf(stage);
    if (index === -1) throw new ReferenceError(`stage ${String(stage)} is not in stock`);
    const nextStage = this.stages.at(index + 1);
    if (nextStage === undefined) throw new Error(`stage ${String(stage)} is the last stage`);
    return nextStage;
  }
}

export default class Inventory {
  private static readonly POOL_CAPACITY: ReadonlyMap<InventoryStockStage, number> = new Map([
    [InventoryStockStage.Owned, 7],
    [InventoryStockStage.Unused, Infinity],
    [InventoryStockStage.Used, Infinity],
  ]);

  private static readonly TILE_STAGES: ReadonlyArray<InventoryStockStage> = [
    InventoryStockStage.Unused,
    InventoryStockStage.Owned,
    InventoryStockStage.Used,
  ];

  get tilesPerPlayer(): number {
    return Inventory.POOL_CAPACITY.get(InventoryStockStage.Owned) ?? Infinity;
  }

  get unusedTilesCount(): number {
    return this.stock.getPoolItemsProjection({ owner: null, stage: InventoryStockStage.Unused }).length;
  }

  private constructor(private readonly stock: Stock<InventoryTile, InventoryStockStage, MatchPlayer | null>) {}

  static clone(source: Inventory): Inventory {
    return new Inventory(Stock.clone(source.stock));
  }

  static create(players: ReadonlyArray<MatchPlayer>, randomizerFunction: () => number): Inventory {
    const tiles = LetterService.getAllTiles();
    ShuffleService.shuffle({ array: tiles, randomizerFunction });
    const stock = Stock.create<InventoryTile, InventoryStockStage, MatchPlayer>(
      [...Inventory.TILE_STAGES],
      tiles,
      [...players],
      Inventory.POOL_CAPACITY,
    );
    const inventory = new Inventory(stock);
    inventory.initializePlayerPools(players);
    return inventory;
  }

  areTilesEqual(firstTile: InventoryTile, secondTile: InventoryTile): boolean {
    return firstTile === secondTile;
  }

  discardTile({ tile }: { player: MatchPlayer; tile: InventoryTile }): void {
    this.stock.advanceItemStage(tile);
  }

  getLetterPoints(letter: InventoryLetter): number {
    return LetterService.getLetterPoints(letter);
  }

  getTileCollectionFor(player: MatchPlayer): InventoryTileCollection {
    const tiles = this.getTilesFor(player);
    const collection = new Map<InventoryLetter, Array<InventoryTile>>();
    for (const tile of tiles) {
      const letter = this.getTileLetter(tile);
      let letterArray = collection.get(letter);
      if (letterArray === undefined) collection.set(letter, (letterArray = []));
      letterArray.push(tile);
    }
    return collection;
  }

  getTileLetter(tile: InventoryTile): InventoryLetter {
    return LetterService.getTileLetter(tile);
  }

  getTilePoints(tile: InventoryTile): number {
    return this.getLetterPoints(this.getTileLetter(tile));
  }

  getTilesFor(player: MatchPlayer): ReadonlyArray<InventoryTile> {
    return this.stock.getPoolItemsProjection({ owner: player, stage: InventoryStockStage.Owned });
  }

  hasTilesFor(player: MatchPlayer): boolean {
    return this.stock.getPoolItemsProjection({ owner: player, stage: InventoryStockStage.Owned }).length > 0;
  }

  replenishTilesFor(player: MatchPlayer): void {
    const playerTileCount = this.stock.getPoolItemsProjection({ owner: player, stage: InventoryStockStage.Owned }).length;
    const drawCount = Math.min(this.tilesPerPlayer - playerTileCount, this.unusedTilesCount);
    for (let idx = 0; idx < drawCount; idx++) {
      const unusedTiles = this.stock.getPoolItemsProjection({ owner: null, stage: InventoryStockStage.Unused });
      const tile = unusedTiles.at(-1);
      if (tile === undefined) break;
      this.stock.advanceItemStage(tile, player);
    }
  }

  shuffleTilesFor(player: MatchPlayer): void {
    this.stock.shufflePool({ owner: player, stage: InventoryStockStage.Owned });
  }

  private initializePlayerPools(players: ReadonlyArray<MatchPlayer>): void {
    for (const player of players) {
      this.replenishTilesFor(player);
    }
  }
}
