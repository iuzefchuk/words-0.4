import ShuffleService from '@/domain/services/ShuffleService.ts';
import { InventoryLetter } from '@/domain/value-objects/enums.ts';
import type { MatchPlayer } from '@/domain/value-objects/enums.ts';
import type { InventoryTile, InventoryTileCollection } from '@/domain/value-objects/types.ts';

class TilePool {
  get tileCount(): number {
    return this.tiles.length;
  }

  get tilesView(): ReadonlyArray<InventoryTile> {
    return this.tiles;
  }

  private constructor(
    private readonly capacity: number,
    private readonly tiles: Array<InventoryTile>,
  ) {}

  static create({ capacity = Infinity, tiles }: { capacity?: number; tiles?: Array<InventoryTile> } = {}): TilePool {
    return new TilePool(capacity, tiles ?? []);
  }

  addTile(tile: InventoryTile): void {
    if (this.tiles.includes(tile)) throw new Error(`tile ${tile} is already in pool`);
    this.validateCapacity(this.tiles.length + 1);
    this.tiles.push(tile);
  }

  popTile(): InventoryTile {
    const tile = this.tiles.pop();
    if (tile === undefined) throw new Error('cannot pop tile: pool is empty');
    return tile;
  }

  removeTile(tile: InventoryTile): InventoryTile {
    const index = this.tiles.indexOf(tile);
    if (index === -1) throw new ReferenceError(`tile ${tile} is not in pool`);
    const [removedTile] = this.tiles.splice(index, 1);
    if (removedTile === undefined) throw new ReferenceError(`tile ${tile} is not in pool`);
    return removedTile;
  }

  shuffle(): void {
    ShuffleService.shuffle({ array: this.tiles });
  }

  private validateCapacity(newTileCount: number): void {
    if (newTileCount > this.capacity) {
      throw new Error(`cannot add tile: pool capacity ${String(this.capacity)} exceeded`);
    }
  }
}

export default class Inventory {
  static readonly PLAYER_POOL_CAPACITY = 7;

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
      Array.from({ length: Inventory.LETTER_CONFIG[letter].count }, (_, idx) => {
        const tile = `${letter}-${String(idx)}` as InventoryTile;
        return [tile, letter] as const;
      }),
    ),
  );

  get tilesPerPlayer(): number {
    return Inventory.PLAYER_POOL_CAPACITY;
  }

  get unusedTilesCount(): number {
    return this.drawPool.tileCount;
  }

  private constructor(
    private readonly drawPool: TilePool,
    private readonly playerPools: ReadonlyMap<MatchPlayer, TilePool>,
    private readonly discardPool: TilePool,
  ) {}

  static clone(source: Inventory): Inventory {
    const extractTiles = (pool: TilePool): Array<InventoryTile> =>
      'tilesView' in pool ? [...pool.tilesView] : [...(pool as unknown as { tiles: Array<InventoryTile> }).tiles];
    const drawPool = TilePool.create({ tiles: extractTiles(source.drawPool) });
    const playerPools = new Map(
      [...source.playerPools].map(
        ([player, pool]) =>
          [player, TilePool.create({ capacity: Inventory.PLAYER_POOL_CAPACITY, tiles: extractTiles(pool) })] as const,
      ),
    );
    const discardPool = TilePool.create({ tiles: extractTiles(source.discardPool) });
    return new Inventory(drawPool, playerPools, discardPool);
  }

  static create(players: ReadonlyArray<MatchPlayer>, randomizerFunction: () => number): Inventory {
    const tiles = [...Inventory.LETTER_BY_TILE.keys()];
    ShuffleService.shuffle({ array: tiles, randomizerFunction });
    const drawPool = TilePool.create({ tiles });
    const playerPools = new Map(players.map(player => [player, TilePool.create({ capacity: this.PLAYER_POOL_CAPACITY })]));
    const discardPool = TilePool.create();
    const inventory = new Inventory(drawPool, playerPools, discardPool);
    inventory.initializePlayerPools();
    return inventory;
  }

  areTilesEqual(firstTile: InventoryTile, secondTile: InventoryTile): boolean {
    return firstTile === secondTile;
  }

  discardTile({ player, tile }: { player: MatchPlayer; tile: InventoryTile }): void {
    const removedTile = this.getTilePoolFor(player).removeTile(tile);
    this.discardPool.addTile(removedTile);
  }

  getLetterPoints(letter: InventoryLetter): number {
    return Inventory.LETTER_CONFIG[letter].points;
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
    const letter = Inventory.LETTER_BY_TILE.get(tile);
    if (letter === undefined) throw new ReferenceError(`expected letter for tile ${tile}, got undefined`);
    return letter;
  }

  getTilePoints(tile: InventoryTile): number {
    return this.getLetterPoints(this.getTileLetter(tile));
  }

  getTilesFor(player: MatchPlayer): ReadonlyArray<InventoryTile> {
    return this.getTilePoolFor(player).tilesView;
  }

  hasTilesFor(player: MatchPlayer): boolean {
    return this.getTilePoolFor(player).tileCount > 0;
  }

  replenishTilesFor(player: MatchPlayer): void {
    const pool = this.getTilePoolFor(player);
    this.replenishPlayerPool(pool);
  }

  shuffleTilesFor(player: MatchPlayer): void {
    this.getTilePoolFor(player).shuffle();
  }

  private getTilePoolFor(player: MatchPlayer): TilePool {
    const pool = this.playerPools.get(player);
    if (pool === undefined) throw new ReferenceError(`expected tile pool for player ${player}, got undefined`);
    return pool;
  }

  private initializePlayerPools(): void {
    this.playerPools.forEach(pool => {
      this.replenishPlayerPool(pool);
    });
  }

  private replenishPlayerPool(pool: TilePool): void {
    const drawCount = Math.min(Inventory.PLAYER_POOL_CAPACITY - pool.tileCount, this.unusedTilesCount);
    for (let idx = 0; idx < drawCount; idx++) pool.addTile(this.drawPool.popTile());
  }
}
