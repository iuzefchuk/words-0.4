import { eventsSchemaVersion } from '@/infrastructure/constants.ts';
import BrowserSchedulerGateway from '@/infrastructure/gateways/BrowserSchedulerGateway.ts';
import CryptoIdentifierGateway from '@/infrastructure/gateways/CryptoIdentifierGateway.ts';
import HttpLoaderGateway from '@/infrastructure/gateways/HttpLoaderGateway.ts';
import Mulberry32RandomizerGateway from '@/infrastructure/gateways/Mulberry32RandomizerGateway.ts';
import WebWorkerGateway from '@/infrastructure/gateways/WebWorkerGateway.ts';
import WebWorkerTurnGenerationGateway from '@/infrastructure/gateways/WebWorkerTurnGenerationGateway.ts';
import CallbackBootProgressPublisher from '@/infrastructure/publishers/CallbackBootProgressPublisher.ts';
import IndexedDbEventRepository from '@/infrastructure/repositories/IndexedDbEventRepository.ts';
import LocalStorageSettingsRepository from '@/infrastructure/repositories/LocalStorageSettingsRepository.ts';
import TurnGenerationWorker from '@/infrastructure/workers/turnGenerator.worker.ts?worker';
import type { AppDependencies } from '@/app/types/index.ts';

export default class AppDependenciesFactory {
  private static readonly CONFIG = { dictionaryUrl: '/dictionary.bin' };

  static create(): AppDependencies {
    const turnGenerationTaskId = CryptoIdentifierGateway.create();
    const worker = new WebWorkerGateway({ [turnGenerationTaskId]: TurnGenerationWorker });
    return {
      config: this.CONFIG,
      gateways: {
        app: {
          loader: HttpLoaderGateway,
          scheduler: BrowserSchedulerGateway,
          turnGenerator: new WebWorkerTurnGenerationGateway(worker, turnGenerationTaskId),
        },
        game: {
          identifier: CryptoIdentifierGateway,
          randomizer: Mulberry32RandomizerGateway,
        },
      },
      publishers: { bootProgress: new CallbackBootProgressPublisher() },
      repositories: {
        events: new IndexedDbEventRepository(eventsSchemaVersion),
        settings: new LocalStorageSettingsRepository(),
      },
    };
  }
}
