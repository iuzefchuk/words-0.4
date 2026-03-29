import { AppDependencies } from '@/application/types.ts';
import type { DictionarySnapshot } from '@/domain/models/Dictionary.ts';
import { DictionaryRepository, GameRepository } from '@/domain/ports.ts';
import { GameSnapshot } from '@/domain/types.ts';
import IdGenerator from '@/infrastructure/services/CryptoIdGenerator.ts';
import DateApiClock from '@/infrastructure/services/DateApiClock.ts';
import IndexedDb from '@/infrastructure/services/IndexedDb.ts';
import WebScheduler from '@/infrastructure/services/WebScheduler.ts';

export default class Infrastructure {
  static async createAppDependencies(): Promise<AppDependencies> {
    const idGenerator = new IdGenerator();
    const clock = new DateApiClock();
    const scheduler = new WebScheduler();
    const gameRepository = new IndexedDbGameRepository();
    const dictionaryRepository = new IndexedDbDictionaryRepository();
    return { idGenerator, clock, scheduler, gameRepository, dictionaryRepository };
  }
}

class IndexedDbDictionaryRepository implements DictionaryRepository {
  private static readonly DB_VERSION = 1;
  private static readonly DB_NAME = 'words-dictionary';
  private static readonly STORE_NAME = 'state';
  private static readonly CACHE_KEY = 'dictionary';

  private readonly db = new IndexedDb<DictionarySnapshot>(
    IndexedDbDictionaryRepository.DB_NAME,
    IndexedDbDictionaryRepository.STORE_NAME,
    IndexedDbDictionaryRepository.CACHE_KEY,
  );

  async save(snapshot: DictionarySnapshot): Promise<void> {
    await this.db.save(IndexedDbDictionaryRepository.DB_VERSION, snapshot);
  }

  async load(): Promise<DictionarySnapshot | null> {
    return this.db.load(IndexedDbDictionaryRepository.DB_VERSION);
  }
}

class IndexedDbGameRepository implements GameRepository {
  private static readonly DB_VERSION = 1;
  private static readonly DB_NAME = 'words-game';
  private static readonly STORE_NAME = 'state';
  private static readonly CACHE_KEY = 'game';

  private readonly db = new IndexedDb<GameSnapshot>(
    IndexedDbGameRepository.DB_NAME,
    IndexedDbGameRepository.STORE_NAME,
    IndexedDbGameRepository.CACHE_KEY,
  );

  async save(snapshot: GameSnapshot): Promise<void> {
    await this.db.save(IndexedDbGameRepository.DB_VERSION, snapshot);
  }

  async load(): Promise<GameSnapshot | null> {
    return this.db.load(IndexedDbGameRepository.DB_VERSION);
  }

  async clear(): Promise<void> {
    await this.db.delete();
  }
}
