import { Player } from '@/domain/enums.ts';
import Match from '@/domain/models/match/Match.ts';

export default class WinnerDerivationPolicy {
  static byScore(match: Match): null | Player {
    const userScore = match.getScoreFor(Player.User);
    const opponentScore = match.getScoreFor(Player.Opponent);
    if (userScore === opponentScore) return null;
    return userScore > opponentScore ? Player.User : Player.Opponent;
  }

  static onResignation(resigner: Player): Player {
    return resigner === Player.User ? Player.Opponent : Player.User;
  }
}
