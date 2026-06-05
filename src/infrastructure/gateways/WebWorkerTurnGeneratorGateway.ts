import {
  TurnGenerationWorkerRequestType,
  TurnGenerationWorkerResponseType,
} from '@/infrastructure/workers/turnGenerator.protocol.ts';
import TurnGenerationWorker from '@/infrastructure/workers/turnGenerator.worker.ts?worker';
import type { AppTurnGeneratorGateway } from '@/app/types/gateways.ts';
import type { GameDictionaryBuffer, GameGeneratorContext, GameGeneratorResult, GamePlayer } from '@/app/types/index.ts';
import type {
  TurnGenerationWorkerInput,
  TurnGenerationWorkerRequest,
  TurnGenerationWorkerResponse,
} from '@/infrastructure/workers/turnGenerator.protocol';

type TurnGenerationWorkerConstructor = new () => Worker;

export default class WebWorkerTurnGeneratorGateway {
  private static pool: Array<Worker> = [];

  private static readonly WORKER_CONSTRUCTOR: TurnGenerationWorkerConstructor = TurnGenerationWorker;

  static async generateBestResult(input: {
    attemptsLimit: number;
    context: GameGeneratorContext;
    player: GamePlayer;
  }): Promise<GameGeneratorResult | null> {
    const workerInput = this.createWorkerInput(input);
    const inputs =
      input.attemptsLimit === Infinity
        ? this.partitionWorkerInput(workerInput, input.context.board.anchorCells.size)
        : [workerInput];
    return this.findBestResult(await this.generateResults(inputs));
  }

  static async init(buffer: GameDictionaryBuffer): Promise<void> {
    this.disposePool();
    const workers = Array.from({ length: this.computePoolSize() }, () => this.createWorker());
    try {
      await Promise.all(workers.map(worker => this.initWorker(worker, buffer)));
      this.pool.push(...workers);
    } catch (error) {
      for (const worker of workers) worker.terminate();
      throw error;
    }
  }

  private static computePoolSize(): number {
    const navigator = globalThis.navigator as ({ deviceMemory?: number } & Navigator) | undefined;
    const sizeHint = navigator?.deviceMemory ?? (navigator?.hardwareConcurrency ?? 2) / 2;
    return Math.min(8, Math.max(1, Math.floor(sizeHint)));
  }

  private static createWorker(): Worker {
    return new this.WORKER_CONSTRUCTOR();
  }

  private static createWorkerInput({
    attemptsLimit,
    context,
    player,
  }: {
    attemptsLimit: number;
    context: GameGeneratorContext;
    player: GamePlayer;
  }): TurnGenerationWorkerInput {
    const { crossCheckTable, dictionary, ...data } = context;
    return {
      attemptsLimit,
      buffer: dictionary.buffer,
      crossCheckBuffer: crossCheckTable.buffer,
      ...data,
      player,
    };
  }

  private static disposePool(): void {
    for (const worker of this.pool) worker.terminate();
    this.pool = [];
  }

  private static findBestResult(results: ReadonlyArray<GameGeneratorResult>): GameGeneratorResult | null {
    let bestResult: GameGeneratorResult | null = null;
    let bestScore = -1;
    for (const result of results) {
      if (result.validationResult.score > bestScore) {
        bestResult = result;
        bestScore = result.validationResult.score;
      }
    }
    return bestResult;
  }

  private static generateResult(worker: Worker, input: TurnGenerationWorkerInput): Promise<GameGeneratorResult | null> {
    return new Promise((resolve, reject) => {
      let result: GameGeneratorResult | null = null;
      worker.onmessage = (event: MessageEvent<TurnGenerationWorkerResponse>) => {
        if (event.data.type === TurnGenerationWorkerResponseType.Done) resolve(result);
        else if (event.data.type === TurnGenerationWorkerResponseType.Error) reject(new Error(event.data.error));
        else if (event.data.type === TurnGenerationWorkerResponseType.Result) result = event.data.value;
        else reject(new Error(`expected worker generation response, got ${event.data.type}`));
      };
      worker.onerror = () => {
        reject(new Error('worker error'));
      };
      worker.postMessage({
        input,
        type: TurnGenerationWorkerRequestType.Generate,
      } satisfies TurnGenerationWorkerRequest);
    });
  }

  private static async generateResults(inputs: ReadonlyArray<TurnGenerationWorkerInput>): Promise<Array<GameGeneratorResult>> {
    const jobs = inputs.map(input => ({ input, worker: this.takeFromPool() ?? this.createWorker() }));
    try {
      const results = await Promise.all(jobs.map(({ input, worker }) => this.generateResult(worker, input)));
      this.pool.push(...jobs.map(({ worker }) => worker));
      return results.filter((result): result is GameGeneratorResult => result !== null);
    } catch (error) {
      for (const { worker } of jobs) worker.terminate();
      throw error;
    }
  }

  private static initWorker(worker: Worker, buffer: GameDictionaryBuffer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<TurnGenerationWorkerResponse>) => {
        if (event.data.type === TurnGenerationWorkerResponseType.Ready) resolve();
        else if (event.data.type === TurnGenerationWorkerResponseType.Error) reject(new Error(event.data.error));
        else reject(new Error(`expected worker Ready response, got ${event.data.type}`));
      };
      worker.onerror = () => {
        reject(new Error('worker error'));
      };
      worker.postMessage({ input: buffer, type: TurnGenerationWorkerRequestType.Init } satisfies TurnGenerationWorkerRequest);
    });
  }

  private static partitionWorkerInput(
    workerInput: TurnGenerationWorkerInput,
    anchorCount: number,
  ): Array<TurnGenerationWorkerInput> {
    const workerCount = Math.min(this.pool.length, anchorCount);
    if (workerCount <= 1) return [workerInput];
    const inputs: Array<TurnGenerationWorkerInput> = [];
    for (let idx = 0; idx < workerCount; idx++) {
      const offset = Math.round((anchorCount * idx) / workerCount);
      const end = Math.round((anchorCount * (idx + 1)) / workerCount);
      inputs.push({ ...workerInput, partition: { length: end - offset, offset } });
    }
    return inputs;
  }

  private static takeFromPool(): undefined | Worker {
    return this.pool.pop();
  }
}

WebWorkerTurnGeneratorGateway satisfies AppTurnGeneratorGateway;
