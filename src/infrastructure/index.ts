import { AppDependencies } from '@/application/types/index.ts';
import DictionaryWorker from '@/application/workers/dictionary.worker.ts?worker';
import TurnGenerationWorker from '@/application/workers/turnGeneration.worker.ts?worker';
import IndexedDbDictionaryRepository from '@/infrastructure/repositories/IndexedDbDictionaryRepository.ts';
import IndexedDbEventRepository from '@/infrastructure/repositories/IndexedDbEventRepository.ts';
import AsyncSchedulingService from '@/infrastructure/services/AsyncSchedulingService.ts';
import CryptoIdentityService from '@/infrastructure/services/CryptoIdentityService.ts';
import CryptoSeedingService from '@/infrastructure/services/CryptoSeedingService.ts';
import FetchCompressionService from '@/infrastructure/services/FetchCompressionService.ts';
import VersioningService from '@/infrastructure/services/VersioningService.ts';
import WebWorkerService from '@/infrastructure/services/WebWorkerService.ts';

export default class Infrastructure {
  static async createAppDependencies(): Promise<AppDependencies> {
    const version = new VersioningService().getAppVersion();
    const identity = new CryptoIdentityService();
    const dictionaryTaskId = identity.createUniqueId();
    const turnGenerationTaskId = identity.createUniqueId();
    return {
      repositories: {
        dictionary: new IndexedDbDictionaryRepository(version),
        events: new IndexedDbEventRepository(version),
      },
      services: {
        compression: new FetchCompressionService(),
        identity,
        scheduling: new AsyncSchedulingService(),
        seeding: new CryptoSeedingService(),
        worker: new WebWorkerService({
          [dictionaryTaskId]: DictionaryWorker,
          [turnGenerationTaskId]: TurnGenerationWorker,
        }),
      },
      tasks: { dictionary: dictionaryTaskId, turnGeneration: turnGenerationTaskId },
    };
  }
}
