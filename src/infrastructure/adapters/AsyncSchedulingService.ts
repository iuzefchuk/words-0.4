import { SchedulingService } from '@/application/types/ports.ts';

export default class AsyncSchedulingService implements SchedulingService {
  async ensureMinimumDuration<T>(minimumMs: number, callback: () => Promise<T> | T): Promise<T> {
    const startTime = this.getCurrentTime();
    const result = await callback();
    const elapsed = this.getCurrentTime() - startTime;
    const delay = minimumMs - elapsed;
    if (delay > 0) await this.wait(delay);
    return result;
  }

  yield(): Promise<void> {
    if (typeof schedulingService !== 'undefined' && typeof schedulingService.yield === 'function')
      return schedulingService.yield();
    return new Promise(resolve => {
      queueMicrotask(resolve);
    });
  }

  private getCurrentTime(): number {
    return Date.now();
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
