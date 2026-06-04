import { GameMatchDifficulty, GameMatchType } from '@/application/types/index.ts';
import type { GameMatchSettings } from '@/application/types/index.ts';

export const DEFAULT_SETTINGS: GameMatchSettings = {
  difficulty: GameMatchDifficulty.Low,
  type: GameMatchType.Classic,
};
