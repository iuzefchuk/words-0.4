import { Player } from '@/domain/player/types.ts';
import { GameContext, GameState } from '@/application/types.ts';

export default class GameStateQuery {
  static execute(context: GameContext, isMutable: boolean): GameState {
    const { tilePool, turnDirector } = context;
    return {
      isFinished: !isMutable,
      tilesRemaining: tilePool.unusedTilesCount,
      userTiles: tilePool.getTilesFor(Player.User),
      currentTurnScore: turnDirector.currentTurnScore,
      userScore: turnDirector.getScoreFor(Player.User),
      opponentScore: turnDirector.getScoreFor(Player.Opponent),
      currentPlayerIsUser: turnDirector.currentPlayer === Player.User,
      userPassWillBeResign: turnDirector.hasPlayerPassed(Player.User),
    };
  }
}
