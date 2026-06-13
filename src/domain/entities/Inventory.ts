import ShuffleService from '@/domain/services/ShuffleService.ts';
import { InventoryLetter } from '@/domain/value-objects/enums.ts';
import type { MatchPlayer } from '@/domain/value-objects/enums.ts';
import type { InventoryTile, InventoryTileCollection } from '@/domain/value-objects/types.ts';

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

class Pool<Item> {
  get count(): number {
    return this.items.length;
  }

  get projection(): ReadonlyArray<Item> {
    return this.items;
  }

  private constructor(
    private readonly capacity: number,
    private readonly items: Array<Item>,
  ) {}

  static create<T>({ capacity = Infinity, items }: { capacity?: number; items?: Array<T> | undefined } = {}): Pool<T> {
    return new Pool(capacity, items ?? []);
  }

  add(item: Item): void {
    if (this.items.includes(item)) throw new Error(`item ${String(item)} is already in pool`);
    this.validateCapacity(this.items.length + 1);
    this.items.push(item);
  }

  pop(): Item {
    const item = this.items.pop();
    if (item === undefined) throw new Error('cannot pop item: pool is empty');
    return item;
  }

  remove(item: Item): Item {
    const index = this.items.indexOf(item);
    if (index === -1) throw new ReferenceError(`item ${String(item)} is not in pool`);
    const [removedItem] = this.items.splice(index, 1);
    if (removedItem === undefined) throw new ReferenceError(`item ${String(item)} is not in pool`);
    return removedItem;
  }

  shuffle(): void {
    ShuffleService.shuffle({ array: this.items });
  }

  private validateCapacity(newItemCount: number): void {
    if (newItemCount > this.capacity) {
      throw new Error(`cannot add item: pool capacity ${String(this.capacity)} exceeded`);
    }
  }
}

export default class Inventory {
  private static readonly PLAYER_TILE_POOL_CAPACITY = 7;

  get tilesPerPlayer(): number {
    return Inventory.PLAYER_TILE_POOL_CAPACITY;
  }

  get unusedTilesCount(): number {
    return this.drawPool.count;
  }

  private constructor(
    private readonly drawPool: Pool<InventoryTile>,
    private readonly playerPools: ReadonlyMap<MatchPlayer, Pool<InventoryTile>>,
    private readonly discardPool: Pool<InventoryTile>,
  ) {}

  static clone(source: Inventory): Inventory {
    const extractItems = (pool: Pool<InventoryTile>): Array<InventoryTile> => [...pool.projection];
    const drawPool = Pool.create({ items: extractItems(source.drawPool) });
    const itemsBy = new Map([...source.playerPools].map(([player, pool]) => [player, extractItems(pool)]));
    const playerPools = Inventory.createPlayerPools([...itemsBy.keys()], itemsBy);
    const discardPool = Pool.create({ items: extractItems(source.discardPool) });
    return new Inventory(drawPool, playerPools, discardPool);
  }

  static create(players: ReadonlyArray<MatchPlayer>, randomizerFunction: () => number): Inventory {
    const tiles = LetterService.getAllTiles();
    ShuffleService.shuffle({ array: tiles, randomizerFunction });
    const drawPool = Pool.create({ items: tiles });
    const playerPools = Inventory.createPlayerPools(players);
    const discardPool = Pool.create<InventoryTile>();
    const inventory = new Inventory(drawPool, playerPools, discardPool);
    inventory.initializePlayerPools();
    return inventory;
  }

  private static createPlayerPools(
    players: ReadonlyArray<MatchPlayer>,
    itemsBy?: ReadonlyMap<MatchPlayer, Array<InventoryTile>>,
  ): ReadonlyMap<MatchPlayer, Pool<InventoryTile>> {
    return new Map(
      players.map(player => [
        player,
        Pool.create<InventoryTile>({ capacity: Inventory.PLAYER_TILE_POOL_CAPACITY, items: itemsBy?.get(player) }),
      ]),
    );
  }

  areTilesEqual(firstTile: InventoryTile, secondTile: InventoryTile): boolean {
    return firstTile === secondTile;
  }

  discardTile({ player, tile }: { player: MatchPlayer; tile: InventoryTile }): void {
    const removedTile = this.getPoolFor(player).remove(tile);
    this.discardPool.add(removedTile);
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
    return this.getPoolFor(player).projection;
  }

  hasTilesFor(player: MatchPlayer): boolean {
    return this.getPoolFor(player).count > 0;
  }

  replenishTilesFor(player: MatchPlayer): void {
    this.replenishPlayerPool(this.getPoolFor(player));
  }

  shuffleTilesFor(player: MatchPlayer): void {
    this.getPoolFor(player).shuffle();
  }

  private getPoolFor(player: MatchPlayer): Pool<InventoryTile> {
    const pool = this.playerPools.get(player);
    if (pool === undefined) throw new ReferenceError(`expected item pool for player ${player}, got undefined`);
    return pool;
  }

  private initializePlayerPools(): void {
    this.playerPools.forEach(pool => {
      this.replenishPlayerPool(pool);
    });
  }

  private replenishPlayerPool(pool: Pool<InventoryTile>): void {
    const drawCount = Math.min(Inventory.PLAYER_TILE_POOL_CAPACITY - pool.count, this.unusedTilesCount);
    for (let idx = 0; idx < drawCount; idx++) pool.add(this.drawPool.pop());
  }
}
