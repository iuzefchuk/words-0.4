import type { GamePlayer } from '@/domain/enums.ts';
import type { GameDictionaryBuffer, GameGeneratorContext, GameGeneratorResult } from '@/domain/types/index.ts';

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
    context: GameGeneratorContext;
    player: GamePlayer;
  }): Promise<GameGeneratorResult | null>;
  init(buffer: GameDictionaryBuffer): Promise<void>;
};
