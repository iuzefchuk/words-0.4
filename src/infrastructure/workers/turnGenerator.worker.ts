import { DomainTurnGenerator } from '@/app/types/index.ts';
import { DomainDictionary } from '@/app/types/index.ts';
import CryptoIdentifierGateway from '@/infrastructure/gateways/CryptoIdentifierGateway.ts';
import {
  TurnGenerationWorkerRequestType,
  TurnGenerationWorkerResponseType,
} from '@/infrastructure/workers/turnGenerator.protocol.ts';
import type { DomainTurnGenerationResult } from '@/app/types/index.ts';
import type { TurnGenerationWorkerInput, TurnGenerationWorkerRequest } from '@/infrastructure/workers/turnGenerator.protocol.ts';

class TurnGeneratorWorker {
  private dictionary: DomainDictionary | null = null;

  handleMessage(event: MessageEvent<TurnGenerationWorkerRequest>): void {
    if (event.data.type === TurnGenerationWorkerRequestType.Init) {
      this.init(event.data.input);
    } else {
      this.stream(event.data.input);
    }
  }

  private findBestResult(input: TurnGenerationWorkerInput): DomainTurnGenerationResult | null {
    const dictionary = this.dictionary ?? DomainDictionary.create(new Int32Array(input.buffer));
    const context = DomainTurnGenerator.hydrateContext(input, dictionary, input.crossCheckBuffer, CryptoIdentifierGateway);
    let bestResult: DomainTurnGenerationResult | null = null;
    let bestScore = -1;
    let count = 0;
    for (const result of DomainTurnGenerator.execute(context, input.player, input.partition)) {
      if (result.evaluation.computation.score > bestScore) {
        bestResult = result;
        bestScore = result.evaluation.computation.score;
      }
      if (++count >= input.attemptsLimit) break;
    }
    return bestResult;
  }

  private init(buffer: ArrayBufferLike): void {
    this.dictionary = DomainDictionary.create(new Int32Array(buffer));
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
