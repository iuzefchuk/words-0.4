import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
import type { GameMatchDifficulty, GameMatchType } from '@/app/types/index.ts';

export function handleChangeMatchDifficulty(matchDifficulty: GameMatchDifficulty): void {
  const { changeMatchDifficulty } = MainStore.INSTANCE();
  changeMatchDifficulty(matchDifficulty);
}

export function handleChangeMatchType(matchType: GameMatchType): void {
  const { changeMatchType } = MainStore.INSTANCE();
  const { initialize } = UserStore.INSTANCE();
  changeMatchType(matchType);
  initialize();
}
