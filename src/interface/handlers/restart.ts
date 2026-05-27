import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';

export function handleRestartGame(): void {
  const { restartGame } = MainStore.INSTANCE();
  const { initialize } = UserStore.INSTANCE();
  restartGame();
  initialize();
}
