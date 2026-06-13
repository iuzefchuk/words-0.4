import DialogStore from '@/interface/stores/DialogStore.ts';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';

const RESIGN_DELAY_MS = 500;

export async function handlePass(): Promise<void> {
  const { pass, userPassWillBeResign } = MainStore.INSTANCE();
  if (userPassWillBeResign) return handleResign();
  const { isConfirmed } = await triggerPassDialog();
  if (!isConfirmed) return;
  pass();
}

export async function handleResign(): Promise<void> {
  const { resign } = MainStore.INSTANCE();
  const { isConfirmed } = await triggerResignDialog();
  if (!isConfirmed) return;
  setTimeout(() => {
    resign();
  }, RESIGN_DELAY_MS);
}

export function handleSave(): void {
  const { save } = MainStore.INSTANCE();
  const { initialize } = UserStore.INSTANCE();
  save();
  initialize();
}

async function triggerPassDialog(): Promise<{ isCanceled: boolean; isConfirmed: boolean; isDismissed: boolean }> {
  const { trigger } = DialogStore.INSTANCE();
  return await trigger({
    html: window.text('dialog.html_pass'),
    title: window.text('dialog.title_pass'),
  });
}

async function triggerResignDialog(): Promise<{ isCanceled: boolean; isConfirmed: boolean; isDismissed: boolean }> {
  const { trigger } = DialogStore.INSTANCE();
  return await trigger({
    html: window.text('dialog.html_resign'),
    isDestructive: true,
    title: window.text('dialog.title_resign'),
  });
}
