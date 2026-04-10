export { IdentityService, SeedingService } from '@/domain/types/ports.ts';

export type CompressionService = {
  fetchAndDecompress(url: string): Promise<string>;
};

export type SchedulingService = {
  getCurrentTime(): number;
  wait(ms: number): Promise<void>;
  yield(): Promise<void>;
};
