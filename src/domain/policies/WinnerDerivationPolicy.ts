import { MatchPlayer } from '@/domain/value-objects/enums.ts';
import type Match from '@/domain/entities/Match.ts';

export default class WinnerDerivationPolicy {
  static byScore(match: Match): MatchPlayer | null {
    const userScore = match.getScoreFor(MatchPlayer.User);
    const opponentScore = match.getScoreFor(MatchPlayer.Opponent);
    if (userScore === opponentScore) return null;
    return userScore > opponentScore ? MatchPlayer.User : MatchPlayer.Opponent;
  }

  static onResignation(resigner: MatchPlayer): MatchPlayer {
    return resigner === MatchPlayer.User ? MatchPlayer.Opponent : MatchPlayer.User;
  }
}
