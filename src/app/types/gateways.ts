import type { DomainMatchPlayer } from '@/domain/published/enums.ts';
import type { DomainTurnGenerationContext, DomainTurnGenerationResult } from '@/domain/published/types.ts';

export type AppGateways = {
  loader: AppLoaderGateway;
  scheduler: AppSchedulerGateway;
  turnGenerator: AppTurnGeneratorGateway;
};

export type AppLoaderGateway = {
  load(url: string): Promise<ArrayBufferLike>;
};

export type AppSchedulerGateway = {
  padTo<T>(minimumMs: number, callback: () => Promise<T> | T): Promise<T>;
  yield(): Promise<void>;
};

export type AppTurnGeneratorGateway = {
  generateBestResult(input: {
    attemptsLimit: number;
    context: DomainTurnGenerationContext;
    player: DomainMatchPlayer;
  }): Promise<DomainTurnGenerationResult | null>;
  init(buffer: ArrayBufferLike): Promise<void>;
};
