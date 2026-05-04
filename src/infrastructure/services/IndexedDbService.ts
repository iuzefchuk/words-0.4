export default class IndexedDbService<T> {
  private static readonly APP_VERSION_KEY = 'appVersion';

  private static readonly SCHEMA_VERSION = 3;

  private dbPromise: null | Promise<IDBDatabase> = null;

  constructor(
    private readonly dbName: string,
    private readonly eventsStore: string,
    private readonly metaStore: string,
  ) {}

  async append(appVersion: string, events: ReadonlyArray<T>): Promise<void> {
    if (events.length === 0) return;
    try {
      const db = await this.openDatabase();
      await this.appendBatch(db, appVersion, events);
    } catch {
      // silently fail — caching is best-effort
    }
  }

  async delete(): Promise<void> {
    try {
      const db = await this.openDatabase();
      await this.clearAll(db);
    } catch {
      // silently fail — caching is best-effort
    }
  }

  async load(appVersion: string): Promise<null | ReadonlyArray<T>> {
    try {
      const db = await this.openDatabase();
      const storedAppVersion = await this.getStoredAppVersion(db);
      if (storedAppVersion === undefined) return null;
      if (storedAppVersion !== appVersion) {
        await this.clearAll(db);
        return null;
      }
      return await this.getAllEvents(db);
    } catch {
      return null;
    }
  }

  private appendBatch(db: IDBDatabase, appVersion: string, events: ReadonlyArray<T>): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.eventsStore, this.metaStore], 'readwrite');
      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onerror = () => {
        reject(transaction.error ?? new Error('IndexedDB transaction failed'));
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
      };
      const eventsStore = transaction.objectStore(this.eventsStore);
      for (const event of events) eventsStore.add(event);
      transaction.objectStore(this.metaStore).put(appVersion, IndexedDbService.APP_VERSION_KEY);
    });
  }

  private clearAll(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.eventsStore, this.metaStore], 'readwrite');
      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onerror = () => {
        reject(transaction.error ?? new Error('IndexedDB transaction failed'));
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
      };
      transaction.objectStore(this.eventsStore).clear();
      transaction.objectStore(this.metaStore).clear();
    });
  }

  private getAllEvents(db: IDBDatabase): Promise<ReadonlyArray<T>> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.eventsStore, 'readonly');
      const request = transaction.objectStore(this.eventsStore).getAll();
      request.onsuccess = () => {
        resolve(request.result as ReadonlyArray<T>);
      };
      request.onerror = () => {
        reject(request.error ?? new Error('IndexedDB request failed'));
      };
    });
  }

  private getStoredAppVersion(db: IDBDatabase): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.metaStore, 'readonly');
      const request = transaction.objectStore(this.metaStore).get(IndexedDbService.APP_VERSION_KEY);
      request.onsuccess = () => {
        resolve(request.result as string | undefined);
      };
      request.onerror = () => {
        reject(request.error ?? new Error('IndexedDB request failed'));
      };
    });
  }

  private openDatabase(): Promise<IDBDatabase> {
    this.dbPromise ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, IndexedDbService.SCHEMA_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const name of Array.from(db.objectStoreNames)) db.deleteObjectStore(name);
        db.createObjectStore(this.eventsStore, { autoIncrement: true });
        db.createObjectStore(this.metaStore);
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error ?? new Error('IndexedDB open failed'));
      };
    });
    return this.dbPromise;
  }
}
