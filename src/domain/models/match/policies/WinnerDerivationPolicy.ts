import { GamePlayer } from '@/domain/enums.ts';
import Match from '@/domain/models/match/Match.ts';

export default class WinnerDerivationPolicy {
  static byScore(match: Match): GamePlayer | null {
    const userScore = match.getScoreFor(GamePlayer.User);
    const opponentScore = match.getScoreFor(GamePlayer.Opponent);
    if (userScore === opponentScore) return null;
    return userScore > opponentScore ? GamePlayer.User : GamePlayer.Opponent;
  }

  static onResignation(resigner: GamePlayer): GamePlayer {
    return resigner === GamePlayer.User ? GamePlayer.Opponent : GamePlayer.User;
  }
}
