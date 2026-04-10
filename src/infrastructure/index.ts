import { AppDependencies } from '@/application/types/index.ts';
import IndexedDbDictionaryRepository from '@/infrastructure/repositories/IndexedDbDictionaryRepository.ts';
import IndexedDbEventRepository from '@/infrastructure/repositories/IndexedDbEventRepository.ts';
import AsyncSchedulingService from '@/infrastructure/services/AsyncSchedulingService.ts';
import CryptoIdentityService from '@/infrastructure/services/CryptoIdentityService.ts';
import CryptoSeedingService from '@/infrastructure/services/CryptoSeedingService.ts';
import FetchCompressionService from '@/infrastructure/services/FetchCompressionService.ts';
import VersioningService from '@/infrastructure/services/VersioningService.ts';

export default class Infrastructure {
  static async createAppDependencies(): Promise<AppDependencies> {
    const version = new VersioningService().getAppVersion();
    return {
      repositories: {
        dictionary: new IndexedDbDictionaryRepository(version),
        events: new IndexedDbEventRepository(version),
      },
      services: {
        compression: new FetchCompressionService(),
        identity: new CryptoIdentityService(),
        scheduling: new AsyncSchedulingService(),
        seeding: new CryptoSeedingService(),
      },
    };
  }
}
