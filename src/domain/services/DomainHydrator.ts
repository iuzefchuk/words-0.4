import Domain from '@/domain/index.ts';
import Board from '@/domain/models/Board.ts';
import Dictionary from '@/domain/models/Dictionary.ts';
import Inventory, { Tile, TilePool } from '@/domain/models/Inventory.ts';
import TurnTracker, { Turn } from '@/domain/models/TurnTracker.ts';

export default class DomainHydrator {
  static execute(data: unknown): Domain {
    const domain = this.setProto<{
      board: unknown;
      dictionary: unknown;
      inventory: unknown;
      turnTracker: unknown;
    }>(data, Domain.prototype);
    this.setProto(domain.board, Board.prototype);
    this.setProto(domain.dictionary, Dictionary.prototype);
    this.hydrateInventory(domain.inventory);
    this.hydrateTurnTracker(domain.turnTracker);
    return domain as unknown as Domain;
  }

  private static hydrateInventory(data: unknown): void {
    const inventory = this.setProto<{
      drawPool: unknown;
      poolByPlayer: Map<unknown, unknown>;
      discardPool: unknown;
      tileById: Map<unknown, unknown>;
    }>(data, Inventory.prototype);
    this.hydrateTilePool(inventory.drawPool);
    for (const pool of inventory.poolByPlayer.values()) this.hydrateTilePool(pool);
    this.hydrateTilePool(inventory.discardPool);
    for (const tile of inventory.tileById.values()) this.setProto(tile, Tile.prototype);
  }

  private static hydrateTilePool(data: unknown): void {
    const pool = this.setProto<{ tiles: Array<unknown> }>(data, TilePool.prototype);
    for (const tile of pool.tiles) this.setProto(tile, Tile.prototype);
  }

  private static hydrateTurnTracker(data: unknown): void {
    const tracker = this.setProto<{ turns: Array<unknown> }>(data, TurnTracker.prototype);
    for (const turn of tracker.turns) this.setProto(turn, Turn.prototype);
  }

  private static setProto<T>(data: unknown, prototype: object): T {
    return Object.setPrototypeOf(data, prototype) as T;
  }
}
