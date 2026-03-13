import { TileId } from '@/domain/tiles/types.ts';
import { GameContext } from '@/application/types.ts';

export default class SaveTurn {
  static execute(context: GameContext): void {
    const { turnDirector, tilePool } = context;
    const player = turnDirector.currentPlayer;
    const tiles = turnDirector.currentTurnTileSequence;
    if (!tiles) throw new Error('Current turn tile sequence does not exist');
    turnDirector.saveCurrentTurn();
    tiles.forEach((tile: TileId) => tilePool.discardTile({ player, tileId: tile }));
    tilePool.replenishTilesFor(player);
  }
}
