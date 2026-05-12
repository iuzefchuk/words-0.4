import DialogStore from '@/interface/stores/DialogStore/DialogStore.ts';
import MainStore from '@/interface/stores/MainStore/MainStore.ts';
import UserStore from '@/interface/stores/UserStore/UserStore.ts';

const RESIGN_DELAY_MS = 500;

export async function handlePass(): Promise<void> {
  const mainStore = MainStore.INSTANCE();
  if (mainStore.userPassWillBeResign) return handleResign();
  const { isConfirmed } = await triggerPassDialog();
  if (!isConfirmed) return;
  mainStore.pass();
}

export async function handleResign(): Promise<void> {
  const { isConfirmed } = await triggerResignDialog();
  if (!isConfirmed) return;
  setTimeout(() => {
    MainStore.INSTANCE().resign();
  }, RESIGN_DELAY_MS);
}

export function handleSave(): void {
  MainStore.INSTANCE().save();
  UserStore.INSTANCE().initialize();
}

async function triggerPassDialog(): Promise<{ isCanceled: boolean; isConfirmed: boolean; isDismissed: boolean }> {
  return await DialogStore.INSTANCE().trigger({
    cancelText: window.text('general.dialog_cancel'),
    confirmText: window.text('general.dialog_confirm'),
    html: window.text('general.dialog_html_pass'),
    title: window.text('general.dialog_title_pass'),
  });
}

async function triggerResignDialog(): Promise<{ isCanceled: boolean; isConfirmed: boolean; isDismissed: boolean }> {
  return await DialogStore.INSTANCE().trigger({
    cancelText: window.text('general.dialog_cancel'),
    confirmText: window.text('general.dialog_confirm'),
    html: window.text('general.dialog_html_resign'),
    isDestructive: true,
    title: window.text('general.dialog_title_resign'),
  });
}
