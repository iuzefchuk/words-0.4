import { AppDependencies } from '@/application/types.ts';
import { DictionaryRepository, GameRepository, GameSnapshot } from '@/domain/types.ts';
import AppVersionProvider from '@/infrastructure/services/AppVersionProvider.ts';
import IdGenerator from '@/infrastructure/services/CryptoIdGenerator.ts';
import DateApiClock from '@/infrastructure/services/DateApiClock.ts';
import IndexedDb from '@/infrastructure/services/IndexedDb.ts';
import WebScheduler from '@/infrastructure/services/WebScheduler.ts';
import type { DictionarySnapshot } from '@/domain/models/dictionary/types.ts';

class IndexedDbDictionaryRepository implements DictionaryRepository {
  private static readonly CACHE_KEY = 'state';
  private static readonly DB_NAME = 'words-dictionary';
  private static readonly STORE_NAME = 'dictionary';

  private readonly db = new IndexedDb<DictionarySnapshot>(
    IndexedDbDictionaryRepository.DB_NAME,
    IndexedDbDictionaryRepository.STORE_NAME,
    IndexedDbDictionaryRepository.CACHE_KEY,
  );

  constructor(private readonly version: string) {}

  async load(): Promise<DictionarySnapshot | null> {
    return this.db.load(this.version);
  }

  async save(snapshot: DictionarySnapshot): Promise<void> {
    await this.db.save(this.version, snapshot);
  }
}

class IndexedDbGameRepository implements GameRepository {
  private static readonly CACHE_KEY = 'state';
  private static readonly DB_NAME = 'words-game';
  private static readonly STORE_NAME = 'game';

  private readonly db = new IndexedDb<GameSnapshot>(
    IndexedDbGameRepository.DB_NAME,
    IndexedDbGameRepository.STORE_NAME,
    IndexedDbGameRepository.CACHE_KEY,
  );

  constructor(private readonly version: string) {}

  async delete(): Promise<void> {
    await this.db.delete();
  }

  async load(): Promise<GameSnapshot | null> {
    return this.db.load(this.version);
  }

  async save(snapshot: GameSnapshot): Promise<void> {
    await this.db.save(this.version, snapshot);
  }
}

export default class Infrastructure {
  static async createAppDependencies(): Promise<AppDependencies> {
    const versionProvider = new AppVersionProvider();
    const version = versionProvider.execute();
    return {
      clock: new DateApiClock(),
      idGenerator: new IdGenerator(),
      repositories: {
        dictionary: new IndexedDbDictionaryRepository(version),
        game: new IndexedDbGameRepository(version),
      },
      scheduler: new WebScheduler(),
    };
  }
}
