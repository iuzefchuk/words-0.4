import { Difficulty, Player } from '@/domain/enums.ts';
import { BoardType } from '@/domain/models/board/enums.ts';
import { MatchResult } from '@/domain/models/match/enums.ts';

export type MatchView = {
  readonly boardType: BoardType;
  readonly difficulty: Difficulty;
  getResultFor(player: Player): MatchResult;
  getScoreFor(player: Player): number;
  readonly isFinished: boolean;
};
