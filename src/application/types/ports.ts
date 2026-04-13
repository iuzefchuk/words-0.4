export { IdentityService, SeedingService } from '@/domain/types/ports.ts';

export type CompressionService = {
  fetchAndDecompress(url: string): Promise<string>;
};

export type SchedulingService = {
  getCurrentTime(): number;
  wait(ms: number): Promise<void>;
  yield(): Promise<void>;
};

export type WorkerService = {
  execute<O>(taskId: string, data: unknown): Promise<O>;
  stream<O>(taskId: string, data: unknown): AsyncGenerator<O>;
};
