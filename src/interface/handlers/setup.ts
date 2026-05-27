import { GameMatchDifficulty, GameMatchType } from '@/application/types/index.ts';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';

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
