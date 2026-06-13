import type { SchedulerGateway } from '@/application/types/gateways.ts';

export default class BrowserSchedulerGateway {
  static async padTo<T>(minimumMs: number, callback: () => Promise<T> | T): Promise<T> {
    const startTime = BrowserSchedulerGateway.getCurrentTime();
    const result = await callback();
    const elapsed = BrowserSchedulerGateway.getCurrentTime() - startTime;
    const delay = minimumMs - elapsed;
    if (delay > 0) await BrowserSchedulerGateway.wait(delay);
    return result;
  }

  static yield(): Promise<void> {
    if ('scheduler' in globalThis && 'yield' in (globalThis as { scheduler: { yield: () => Promise<void> } }).scheduler) {
      return (globalThis as { scheduler: { yield: () => Promise<void> } }).scheduler.yield();
    }
    return new Promise(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(undefined);
    });
  }

  private static getCurrentTime(): number {
    return Date.now();
  }

  private static wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

BrowserSchedulerGateway satisfies SchedulerGateway;
