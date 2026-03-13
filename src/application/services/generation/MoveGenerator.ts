import { Player } from '@/domain/player/types.ts';
import { Axis } from '@/domain/board/types.ts';
import { Placement } from '@/domain/turn/types.ts';
import { GameContext } from '@/application/types.ts';
import { AnchorCoordinates } from '@/domain/board/types.ts';
import CrossCheckComputer from '@/domain/services/CrossCheckComputer.ts';
import PlacementGenerator from '@/application/services/generation/PlacementGenerator.ts';

export default class MoveGenerator {
  static *execute(context: GameContext, player: Player): Generator<Placement> {
    const { tilePool, board, dictionary, turnDirector } = context;
    const playerTileCollection = tilePool.getTileCollectionFor(player);
    if (playerTileCollection.size === 0) return;
    const anchorCells = board.getAnchorCells(turnDirector.historyIsEmpty);
    if (anchorCells.size === 0) return;
    const lettersComputer = new CrossCheckComputer(board, dictionary, tilePool);
    for (const cell of anchorCells) {
      for (const axis of Object.values(Axis)) {
        const coords: AnchorCoordinates = { axis, cell };
        for (const placement of PlacementGenerator.execute({ context, lettersComputer, playerTileCollection, coords }))
          yield placement;
      }
    }
  }
}
