import { GameContext } from '@/application/types.ts';
import { TileId } from '@/domain/models/Inventory.ts';
import { ValidationError } from '@/domain/models/TurnHistory.ts';

export type SaveTurnResult = { error: ValidationError } | { words: ReadonlyArray<string> };

export default class SaveTurn {
  static execute(context: GameContext): SaveTurnResult {
    const { turnDirector, inventory } = context;
    if (turnDirector.currentTurnError) return { error: turnDirector.currentTurnError };
    const player = turnDirector.currentPlayer;
    const tiles = turnDirector.currentTurnTileSequence;
    const words = turnDirector.currentTurnWords;
    if (!tiles) throw new Error('Current turn tile sequence does not exist');
    if (!words) throw new Error('Current turn words do not exist');
    turnDirector.saveCurrentTurn();
    tiles.forEach((tile: TileId) => inventory.discardTile({ player, tile }));
    inventory.replenishTilesFor(player);
    return { words };
  }
}
