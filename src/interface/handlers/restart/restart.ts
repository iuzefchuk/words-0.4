import MainStore from '@/interface/stores/MainStore/MainStore.ts';
import UserStore from '@/interface/stores/UserStore/UserStore.ts';

export function handleRestartGame(): void {
  MainStore.INSTANCE().restartGame();
  UserStore.INSTANCE().initialize();
}
