import { shuffleArrayWithFisherYates } from '@/shared/helpers.ts';
import { Player } from '@/domain/player/types.ts';
import { Letter, TileId, TileCollection } from '@/domain/tiles/types.ts';
import { LETTER_DISTRIBUTION } from '@/domain/tiles/constants.ts';
import Rack from '@/domain/tiles/Rack.ts';
import Tile from '@/domain/tiles/Tile.ts';

export default class TilePool {
  private static readonly rackCapacity = 7;

  private constructor(
    private drawPool: Array<Tile>,
    private racks: Map<Player, Rack>,
    private discardPool: Array<Tile>,
    private readonly tileById: Map<TileId, Tile>,
  ) {
    this.initializeRacks();
  }

  static create({ players }: { players: Array<Player> }): TilePool {
    const drawPool = shuffleArrayWithFisherYates(
      Object.values(Letter).flatMap(letter =>
        Array.from({ length: LETTER_DISTRIBUTION[letter] }, () => Tile.create({ letter })),
      ),
    );
    const racks = new Map(players.map(player => [player, Rack.create({ maxLimit: this.rackCapacity })]));
    const discardPool: Array<Tile> = [];
    const tileById = new Map<TileId, Tile>(drawPool.map(tile => [tile.id, tile]));
    return new TilePool(drawPool, racks, discardPool, tileById);
  }

  get unusedTilesCount(): number {
    return this.drawPool.length;
  }

  getTilesFor(player: Player): ReadonlyArray<TileId> {
    return this.getRackFor(player).tileIds;
  }

  getTileCollectionFor(player: Player): TileCollection {
    return this.getRackFor(player).tileCollection;
  }

  areTilesEqual(firstTile: TileId, secondTile: TileId): boolean {
    return this.getTileById(firstTile).equals(this.getTileById(secondTile));
  }

  getTilePoints(tileId: TileId): number {
    return this.getTileById(tileId).points;
  }

  getTileLetter(tileId: TileId): Letter {
    return this.getTileById(tileId).letter;
  }

  replenishTilesFor(player: Player): void {
    const rack = this.getRackFor(player);
    this.replenishRack(rack);
  }

  discardTile({ player, tileId }: { player: Player; tileId: TileId }): void {
    const removedTile = this.getRackFor(player).discardTile(tileId);
    this.discardPool.push(removedTile);
  }

  shuffleTilesFor(player: Player): void {
    this.getRackFor(player).shuffle();
  }

  private initializeRacks(): void {
    this.racks.forEach(rack => this.replenishRack(rack));
  }

  private getRackFor(player: Player): Rack {
    const rack = this.racks.get(player);
    if (!rack) throw new Error('Inventory rack not found');
    return rack;
  }

  private replenishRack(rack: Rack): void {
    const drawCount = Math.min(TilePool.rackCapacity - rack.tileCount, this.unusedTilesCount);
    for (let i = 0; i < drawCount; i++) {
      const tile = this.drawPool.pop();
      if (!tile) throw new Error('No tiles left in inventory');
      rack.addTile(tile);
    }
  }

  private getTileById(tileId: TileId): Tile {
    const tile = this.tileById.get(tileId);
    if (!tile) throw new Error(`Can't find tile ${tileId}`);
    return tile;
  }
}
