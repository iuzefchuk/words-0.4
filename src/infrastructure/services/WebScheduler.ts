import { Scheduler } from '@/shared/ports.ts';

export default class WebScheduler implements Scheduler {
  yield(): Promise<void> {
    return scheduler.yield();
  }
}
