import { onUnmounted, ref } from 'vue';

export default class UseCounter {
  private readonly valueRef = ref(0);
  private interval: Interval | null = null;

  constructor(private readonly intervalMs: number) {
    onUnmounted(() => this.stopCounter());
  }

  get value(): number {
    return this.valueRef.value;
  }

  restartCounter(callback = () => {}): void {
    this.value = 0;
    this.startCounter(callback);
  }

  stopCounter(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  private set value(newValue: number) {
    this.valueRef.value = newValue;
  }

  private startCounter(callback = () => {}): void {
    this.stopCounter();
    this.interval = setInterval(() => {
      this.value++;
      callback();
    }, this.intervalMs);
  }
}
