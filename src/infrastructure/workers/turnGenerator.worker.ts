import { GameDictionary, GameTurnGenerator } from '@/app/types/index.ts';
import {
  TurnGenerationWorkerRequestType,
  TurnGenerationWorkerResponseType,
} from '@/infrastructure/workers/turnGenerator.protocol';
import type { GameDictionaryBuffer, GameGeneratorResult } from '@/app/types/index.ts';
import type { TurnGenerationWorkerInput, TurnGenerationWorkerRequest } from '@/infrastructure/workers/turnGenerator.protocol';

class TurnGeneratorWorker {
  private dictionary: GameDictionary | null = null;

  handleMessage(event: MessageEvent<TurnGenerationWorkerRequest>): void {
    if (event.data.type === TurnGenerationWorkerRequestType.Init) {
      this.init(event.data.input);
    } else {
      this.stream(event.data.input);
    }
  }

  private findBestResult(input: TurnGenerationWorkerInput): GameGeneratorResult | null {
    const dictionary = this.dictionary ?? GameDictionary.createFromBuffer(input.buffer);
    const context = GameTurnGenerator.hydrateContext(input, dictionary, input.crossCheckBuffer);
    let bestResult: GameGeneratorResult | null = null;
    let bestScore = -1;
    let count = 0;
    for (const result of GameTurnGenerator.execute(context, input.player, input.partition)) {
      if (result.validationResult.score > bestScore) {
        bestResult = result;
        bestScore = result.validationResult.score;
      }
      if (++count >= input.attemptsLimit) break;
    }
    return bestResult;
  }

  private init(buffer: GameDictionaryBuffer): void {
    this.dictionary = GameDictionary.createFromBuffer(buffer);
    self.postMessage({ type: TurnGenerationWorkerResponseType.Ready });
  }

  private stream(input: TurnGenerationWorkerInput): void {
    const bestResult = this.findBestResult(input);
    if (bestResult !== null) {
      self.postMessage({ type: TurnGenerationWorkerResponseType.Result, value: bestResult });
    }
    self.postMessage({ type: TurnGenerationWorkerResponseType.Done });
  }
}

const handler = new TurnGeneratorWorker();

self.onmessage = (event: MessageEvent<TurnGenerationWorkerRequest>) => {
  try {
    handler.handleMessage(event);
  } catch (error) {
    self.postMessage({ error: String(error), type: TurnGenerationWorkerResponseType.Error });
  }
};
