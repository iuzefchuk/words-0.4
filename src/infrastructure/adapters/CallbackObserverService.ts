import { ObserverService } from '@/application/types/ports.ts';

export default class CallbackObserverService implements ObserverService {
  private callback: ((value: number) => void) | null = null;

  publish(value: number): void {
    this.callback?.(value);
  }

  subscribe(callback: (value: number) => void): void {
    this.callback = callback;
  }
}
