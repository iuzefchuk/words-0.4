import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export enum DialogStatus {
  Canceled = 'Canceled',
  Confirmed = 'Confirmed',
  Dismissed = 'Dismissed',
}

type DialogResult = {
  isCanceled: boolean;
  isConfirmed: boolean;
  isDismissed: boolean;
};

type DialogTriggerParams = {
  html: string;
  isDestructive?: boolean;
  title?: string;
};

export default class DialogStore {
  static readonly INSTANCE = defineStore('dialog', () => {
    const store = new DialogStore();
    return {
      html: store.htmlRef,
      isDestructive: store.isDestructiveRef,
      isOpen: store.isOpenRef,
      resolve: store.resolve.bind(store),
      title: store.titleRef,
      trigger: store.trigger.bind(store),
    };
  });

  private readonly htmlRef = ref<null | string>(null);

  private readonly isDestructiveRef = ref(false);

  private readonly isOpenRef = computed(() => this.htmlRef.value !== null);

  private pendingResolve: ((result: DialogResult) => void) | null = null;

  private readonly titleRef = ref<null | string>(null);

  private set html(newValue: null | string) {
    this.htmlRef.value = newValue;
  }

  private set isDestructive(newValue: boolean) {
    this.isDestructiveRef.value = newValue;
  }

  private set title(newValue: null | string) {
    this.titleRef.value = newValue;
  }

  private resetState(): void {
    this.title = null;
    this.html = null;
    this.isDestructive = false;
  }

  private resolve({ status }: { status: DialogStatus }): void {
    if (this.pendingResolve !== null) {
      this.pendingResolve({
        isCanceled: status === DialogStatus.Canceled,
        isConfirmed: status === DialogStatus.Confirmed,
        isDismissed: status === DialogStatus.Dismissed,
      });
      this.pendingResolve = null;
    }
  }

  private async trigger({ html, isDestructive = false, title }: DialogTriggerParams): Promise<DialogResult> {
    this.html = html;
    this.title = title ?? null;
    this.isDestructive = isDestructive;
    const result = await new Promise<DialogResult>(resolve => {
      this.pendingResolve = resolve;
    });
    this.resetState();
    return result;
  }
}
