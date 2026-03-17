import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import DialogStore from '@/gui/stores/DialogStore.ts';
import GameStore from '@/gui/stores/GameStore.ts';
import ItemsStore from '@/gui/stores/ItemsStore.ts';
import ToastStore from '@/gui/stores/ToastStore.ts';

// TODO polish
export default class ButtonsController {
  private storeDialog = DialogStore.getInstance();
  private storeGame = GameStore.getInstance();
  private storeItems = ItemsStore.getInstance();
  private storeToast = ToastStore.getInstance();

  readonly currentPlayerIsUser = storeToRefs(this.storeGame).currentPlayerIsUser;
  readonly allItemsAreConnected = storeToRefs(this.storeItems).allItemsAreConnected;
  readonly isDisabled = computed(() => !this.currentPlayerIsUser.value);

  private async triggerResignDialog() {
    return await this.storeDialog.trigger({ html: 'resigning', title: 'u sure?' });
  }

  async handleResign(): Promise<void> {
    const { isConfirmed } = await this.triggerResignDialog();
    if (!isConfirmed) return;
    this.storeGame.resignGame();
  }

  async handlePass(): Promise<void> {
    if (storeToRefs(this.storeGame).userPassWillBeResign.value) {
      const { isConfirmed } = await this.triggerResignDialog();
      if (!isConfirmed) return;
    } else {
      this.storeToast.addMessage('you passed');
    }
    this.storeGame.passTurn();
  }

  handleShuffle(): void {
    this.storeGame.shuffleUserTiles();
    this.storeItems.initialize();
  }

  handleClear(): void {
    this.storeItems.initialize();
    this.storeGame.resetTurn();
  }

  handlePlay(): void {
    const { opponentTurn, ...result } = this.storeGame.saveTurn();
    if ('error' in result) this.storeToast.addMessage(result.error);
    else this.storeToast.addMessage(result.words.join(','));
    this.storeItems.initialize();
    opponentTurn?.then(opponentResult => {
      if ('words' in opponentResult && opponentResult.words.length > 0) {
        this.storeToast.addMessage(opponentResult.words.join(','));
      } else {
        this.storeToast.addMessage('opponent passed');
      }
    });
  }
}
