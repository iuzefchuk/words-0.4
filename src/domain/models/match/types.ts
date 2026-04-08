import { Player } from '@/domain/enums.ts';
import { MatchResult } from '@/domain/models/match/enums.ts';

export type MatchSnapshot = {
  readonly results: Map<Player, MatchResult | undefined>;
  readonly scores: Map<Player, number>;
};

export type MatchView = {
  getResultFor(player: Player): MatchResult | undefined;
  getScoreFor(player: Player): number;
  readonly isFinished: boolean;
};
