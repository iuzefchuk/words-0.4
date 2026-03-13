import { CellIndex } from '@/domain/board/types.ts';
import { TileId } from '@/domain/tiles/types.ts';
import { GameContext } from '@/application/types.ts';
import TurnValidator from '@/application/services/validation/TurnValidator.ts';

export default class PlaceTile {
  static execute(context: GameContext, { cell, tile }: { cell: CellIndex; tile: TileId }): void {
    context.turnDirector.placeTile({ cell, tile });
    const result = TurnValidator.execute(context, context.turnDirector.currentTurnPlacement);
    context.turnDirector.setCurrentTurnValidation(result);
  }
}
