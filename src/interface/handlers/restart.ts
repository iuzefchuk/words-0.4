import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';

export function handleRestartGame(): void {
  MainStore.INSTANCE().restartGame();
  UserStore.INSTANCE().initialize();
}
