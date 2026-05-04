import { ObserverService } from '@/application/types/ports.ts';

export default class ObserverServiceAdapter {
  private static CALLBACK: ((value: number) => void) | null = null;

  static publish(value: number): void {
    ObserverServiceAdapter.CALLBACK?.(value);
  }

  static subscribe(callback: (value: number) => void): void {
    ObserverServiceAdapter.CALLBACK = callback;
  }
}

ObserverServiceAdapter satisfies ObserverService;
