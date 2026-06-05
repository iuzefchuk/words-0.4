import type { AppTurnGeneratorGateway } from '@/app/types/gateways.ts';
import type {
  GameDictionaryBuffer,
  GameGeneratorContext,
  GameGeneratorContextData,
  GameGeneratorPartition,
  GameGeneratorResult,
  GamePlayer,
} from '@/app/types/index.ts';
import type WebWorkerGateway from '@/infrastructure/gateways/WebWorkerGateway.ts';

type WorkerInput = {
  attemptsLimit: number;
  buffer: GameDictionaryBuffer;
  crossCheckBuffer: ArrayBuffer | SharedArrayBuffer;
  partition?: GameGeneratorPartition;
  player: GamePlayer;
} & GameGeneratorContextData;

export default class WebWorkerTurnGenerationGateway implements AppTurnGeneratorGateway {
  constructor(
    private readonly worker: WebWorkerGateway,
    private readonly taskId: string,
  ) {}

  async generateBestResult(input: {
    attemptsLimit: number;
    context: GameGeneratorContext;
    player: GamePlayer;
  }): Promise<GameGeneratorResult | null> {
    const workerInput = this.createWorkerInput(input);
    const inputs =
      input.attemptsLimit === Infinity
        ? this.partitionWorkerInput(workerInput, input.context.board.anchorCells.size)
        : [workerInput];
    return this.findBestResult(this.worker.stream<GameGeneratorResult>(this.taskId, inputs));
  }

  init(buffer: GameDictionaryBuffer): Promise<void> {
    return this.worker.init(this.taskId, buffer);
  }

  private createWorkerInput({
    attemptsLimit,
    context,
    player,
  }: {
    attemptsLimit: number;
    context: GameGeneratorContext;
    player: GamePlayer;
  }): WorkerInput {
    const { crossCheckTable, dictionary, ...data } = context;
    return {
      attemptsLimit,
      buffer: dictionary.buffer,
      crossCheckBuffer: crossCheckTable.buffer,
      ...data,
      player,
    };
  }

  private async findBestResult(results: AsyncIterable<GameGeneratorResult>): Promise<GameGeneratorResult | null> {
    let bestResult: GameGeneratorResult | null = null;
    let bestScore = -1;
    for await (const result of results) {
      if (result.validationResult.score > bestScore) {
        bestResult = result;
        bestScore = result.validationResult.score;
      }
    }
    return bestResult;
  }

  private partitionWorkerInput(workerInput: WorkerInput, anchorCount: number): Array<WorkerInput> {
    const workerCount = Math.min(this.worker.getPoolSize(this.taskId), anchorCount);
    if (workerCount <= 1) return [workerInput];
    const inputs: Array<WorkerInput> = [];
    for (let idx = 0; idx < workerCount; idx++) {
      const offset = Math.round((anchorCount * idx) / workerCount);
      const end = Math.round((anchorCount * (idx + 1)) / workerCount);
      inputs.push({ ...workerInput, partition: { length: end - offset, offset } });
    }
    return inputs;
  }
}
