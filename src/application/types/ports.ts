export { IdentityService, SeedingService } from '@/domain/types/ports.ts';

export type FileService = {
  loadSharedArrayBuffer(url: string): Promise<SharedArrayBuffer>;
};

export type SchedulingService = {
  getCurrentTime(): number;
  wait(ms: number): Promise<void>;
  yield(): Promise<void>;
};

export type WorkerService = {
  getPoolSize(taskId: string): number;
  init(taskId: string, data: unknown): Promise<void>;
  stream<O>(taskId: string, data: unknown): AsyncGenerator<O>;
  streamParallel<O>(taskId: string, inputs: ReadonlyArray<unknown>): AsyncGenerator<O>;
};
