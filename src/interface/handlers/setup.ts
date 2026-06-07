import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
import type { DomainMatchDifficulty, DomainMatchType } from '@/app/enums/index.ts';

export function handleChangeMatchDifficulty(matchDifficulty: DomainMatchDifficulty): void {
  const { changeMatchDifficulty } = MainStore.INSTANCE();
  changeMatchDifficulty(matchDifficulty);
}

export function handleChangeMatchType(matchType: DomainMatchType): void {
  const { changeMatchType } = MainStore.INSTANCE();
  const { initialize } = UserStore.INSTANCE();
  changeMatchType(matchType);
  initialize();
}
