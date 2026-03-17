import Dictionary from '@/domain/models/Dictionary.ts';
import { DICTIONARY_DATA } from '@/domain/constants.ts';
import { DictionaryCache } from '@/domain/models/Dictionary.ts';

type VersionedCache = { version: number; data: DictionaryCache };

export default class IndexedDbDictionaryFactory {
  private static readonly cacheVersion = DICTIONARY_DATA.length;

  static async create(): Promise<Dictionary> {
    const cache = await this.IndexedDbManager.load(this.cacheVersion);
    if (cache) {
      const dictionary = Dictionary.createFromCache(cache);
      if (dictionary) return dictionary;
    }
    const dictionary = Dictionary.create();
    const versionedCache: VersionedCache = { version: this.cacheVersion, data: dictionary.cache };
    this.IndexedDbManager.save(versionedCache);
    return dictionary;
  }

  static IndexedDbManager = class {
    private static readonly dbName = 'words-dictionary';
    private static readonly storeName = 'cache';
    private static readonly cacheKey = 'dictionary';

    static async load(version: number): Promise<DictionaryCache | null> {
      try {
        const db = await this.openDatabase();
        const cache = await this.getCache(db);
        db.close();
        if (!cache || cache.version !== version) return null;
        return cache.data;
      } catch {
        return null;
      }
    }

    static async save(cache: VersionedCache): Promise<void> {
      try {
        const db = await this.openDatabase();
        await this.setCache(db, cache);
        db.close();
      } catch {
        // silently fail — caching is best-effort
      }
    }

    private static openDatabase(): Promise<IDBDatabase> {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(this.storeName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    private static getCache(db: IDBDatabase): Promise<VersionedCache | undefined> {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const request = transaction.objectStore(this.storeName).get(this.cacheKey);
        request.onsuccess = () => resolve(request.result as VersionedCache | undefined);
        request.onerror = () => reject(request.error);
      });
    }

    private static setCache(db: IDBDatabase, cache: VersionedCache): Promise<void> {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const request = transaction.objectStore(this.storeName).put(cache, this.cacheKey);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  };
}
