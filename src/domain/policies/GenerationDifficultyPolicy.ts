import { MatchDifficulty } from '@/domain/value-objects/enums.ts';

export default class GenerationDifficultyPolicy {
  private static readonly ATTEMPTS_BY_DIFFICULTY: Record<MatchDifficulty, number> = {
    [MatchDifficulty.High]: Infinity,
    [MatchDifficulty.Low]: 1,
    [MatchDifficulty.Medium]: 20,
  };

  static attemptsFor(difficulty: MatchDifficulty): number {
    return GenerationDifficultyPolicy.ATTEMPTS_BY_DIFFICULTY[difficulty];
  }
}
