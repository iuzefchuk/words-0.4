import { computed, inject } from 'vue';
import ProvidesPlugin from '@/gui/plugins/ProvidesPlugin.ts';
import SoundPlayer, { Sound } from '@/gui/services/SoundPlayer.ts';
import RackStore from '@/gui/stores/RackStore.ts';
import MainStore from '@/gui/stores/MainStore.ts';
import DialogStore from '@/gui/stores/DialogStore.ts';

export default class UseButtons {
  readonly allActionsAreDisabled = computed(() => !MainStore.INSTANCE().currentPlayerIsUser);

  private get rackStore() {
    return RackStore.INSTANCE();
  }

  private get mainStore() {
    return MainStore.INSTANCE();
  }

  private get dialogStore() {
    return DialogStore.INSTANCE();
  }

  private constructor(private readonly resignDelayMs: number) {}

  static create(): UseButtons {
    const transitionDurationMs = inject(ProvidesPlugin.TRANSITION_DURATION_MS_KEY, 0);
    const resignDelayMs = transitionDurationMs * 2;
    return new UseButtons(resignDelayMs);
  }

  handleClear(): void {
    this.mainStore.clearTiles();
    this.rackStore.initialize();
    SoundPlayer.play(Sound.SystemClear);
  }

  async handlePass(): Promise<void> {
    if (!this.mainStore.userPassWillBeResign) return this.mainStore.pass();
    this.handleResign();
  }

  handlePlay(): void {
    this.mainStore.save();
    this.rackStore.initialize();
  }

  async handleResign(): Promise<void> {
    const { isConfirmed } = await this.triggerResignDialog();
    if (!isConfirmed) return;
    setTimeout(() => this.mainStore.resign(), this.resignDelayMs);
  }

  handleShuffle(): void {
    this.rackStore.shuffle();
    SoundPlayer.play(Sound.SystemShuffle);
  }

  private async triggerResignDialog() {
    SoundPlayer.play(Sound.SystemDialog);
    return await this.dialogStore.trigger({
      cancelText: window.t('game.dialog_cancel'),
      confirmText: window.t('game.dialog_confirm'),
      html: window.t('game.dialog_html'),
      title: window.t('game.dialog_title'),
    });
  }
}
