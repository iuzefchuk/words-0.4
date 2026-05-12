import { GameMatchDifficulty, GameMatchType } from '@/application/types/index.ts';
import MainStore from '@/interface/stores/MainStore/MainStore.ts';
import UserStore from '@/interface/stores/UserStore/UserStore.ts';

export function handleChangeMatchDifficulty(matchDifficulty: GameMatchDifficulty): void {
  MainStore.INSTANCE().changeMatchDifficulty(matchDifficulty);
}

export function handleChangeMatchType(matchType: GameMatchType): void {
  MainStore.INSTANCE().changeMatchType(matchType);
  UserStore.INSTANCE().initialize();
}
