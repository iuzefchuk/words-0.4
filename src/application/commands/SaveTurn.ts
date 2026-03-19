import { GameContext, GameTurnResult } from '@/application/types.ts';
import { TileId } from '@/domain/models/Inventory.ts';

export default class SaveTurn {
  static execute(context: GameContext): GameTurnResult {
    const { turnDirector, inventory } = context;
    if (turnDirector.currentTurnError) return { ok: false, error: turnDirector.currentTurnError };
    const player = turnDirector.currentPlayer;
    const tiles = turnDirector.currentTurnTiles;
    const words = turnDirector.currentTurnWords;
    if (!words) throw new Error('Current turn words do not exist');
    turnDirector.saveCurrentTurn();
    tiles.forEach((tile: TileId) => inventory.discardTile({ player, tile }));
    inventory.replenishTilesFor(player);
    return { ok: true, value: { words } };
  }
}
