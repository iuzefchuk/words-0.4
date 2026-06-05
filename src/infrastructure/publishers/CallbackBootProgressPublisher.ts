import type { AppBootProgressPublisher } from '@/app/types/publishers.ts';

export default class CallbackBootProgressPublisher implements AppBootProgressPublisher {
  private handler: ((progress: number) => void) | null = null;

  publish(progress: number): void {
    this.handler?.(progress);
  }

  subscribe(handler: (progress: number) => void): void {
    this.handler = handler;
  }
}
