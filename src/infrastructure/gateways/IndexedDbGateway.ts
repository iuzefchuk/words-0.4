export default class IndexedDbGateway {
  private static readonly DB_PROMISES = new Map<string, Promise<IDBDatabase>>();

  private static readonly EVENTS_SCHEMA_VERSION_KEY = 'eventsSchemaVersion';

  private static readonly META_NAME = 'meta';

  private static readonly PAYLOAD_NAME = 'payload';

  private static readonly SCHEMA_VERSION = 4;

  static async append(dbName: string, eventsSchemaVersion: number, payload: ReadonlyArray<unknown>): Promise<void> {
    if (payload.length === 0) return;
    try {
      const db = await IndexedDbGateway.openDatabase(dbName);
      await IndexedDbGateway.appendBatch(db, eventsSchemaVersion, payload);
    } catch (error) {
      console.warn('IndexedDbGateway:', error);
    }
  }

  static async delete(dbName: string): Promise<void> {
    try {
      const db = await IndexedDbGateway.openDatabase(dbName);
      await IndexedDbGateway.clearAll(db);
    } catch (error) {
      console.warn('IndexedDbGateway:', error);
    }
  }

  static async load(dbName: string, eventsSchemaVersion: number): Promise<null | ReadonlyArray<unknown>> {
    try {
      const db = await IndexedDbGateway.openDatabase(dbName);
      const storedEventsSchemaVersion = await IndexedDbGateway.getStoredEventsSchemaVersion(db);
      if (storedEventsSchemaVersion === undefined) return null;
      if (storedEventsSchemaVersion !== eventsSchemaVersion) {
        await IndexedDbGateway.clearAll(db);
        return null;
      }
      return await IndexedDbGateway.getAllPayload(db);
    } catch (error) {
      console.warn('IndexedDbGateway:', error);
      return null;
    }
  }

  private static appendBatch(db: IDBDatabase, eventsSchemaVersion: number, payload: ReadonlyArray<unknown>): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IndexedDbGateway.PAYLOAD_NAME, IndexedDbGateway.META_NAME], 'readwrite');
      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onerror = () => {
        reject(transaction.error ?? new Error('IndexedDB transaction failed'));
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
      };
      const payloadStore = transaction.objectStore(IndexedDbGateway.PAYLOAD_NAME);
      for (const payloadItem of payload) payloadStore.add(payloadItem);
      transaction.objectStore(IndexedDbGateway.META_NAME).put(eventsSchemaVersion, IndexedDbGateway.EVENTS_SCHEMA_VERSION_KEY);
    });
  }

  private static clearAll(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IndexedDbGateway.PAYLOAD_NAME, IndexedDbGateway.META_NAME], 'readwrite');
      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onerror = () => {
        reject(transaction.error ?? new Error('IndexedDB transaction failed'));
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
      };
      transaction.objectStore(IndexedDbGateway.PAYLOAD_NAME).clear();
      transaction.objectStore(IndexedDbGateway.META_NAME).clear();
    });
  }

  private static getAllPayload(db: IDBDatabase): Promise<ReadonlyArray<unknown>> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IndexedDbGateway.PAYLOAD_NAME, 'readonly');
      const request = transaction.objectStore(IndexedDbGateway.PAYLOAD_NAME).getAll();
      request.onsuccess = () => {
        resolve(request.result as ReadonlyArray<unknown>);
      };
      request.onerror = () => {
        reject(request.error ?? new Error('IndexedDB request failed'));
      };
    });
  }

  private static getStoredEventsSchemaVersion(db: IDBDatabase): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IndexedDbGateway.META_NAME, 'readonly');
      const request = transaction.objectStore(IndexedDbGateway.META_NAME).get(IndexedDbGateway.EVENTS_SCHEMA_VERSION_KEY);
      request.onsuccess = () => {
        resolve(request.result as number | undefined);
      };
      request.onerror = () => {
        reject(request.error ?? new Error('IndexedDB request failed'));
      };
    });
  }

  private static openDatabase(dbName: string): Promise<IDBDatabase> {
    let promise = IndexedDbGateway.DB_PROMISES.get(dbName);
    if (promise !== undefined) return promise;
    promise = new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, IndexedDbGateway.SCHEMA_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const name of Array.from(db.objectStoreNames)) db.deleteObjectStore(name);
        db.createObjectStore(IndexedDbGateway.PAYLOAD_NAME, { autoIncrement: true });
        db.createObjectStore(IndexedDbGateway.META_NAME);
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        IndexedDbGateway.DB_PROMISES.delete(dbName);
        reject(request.error ?? new Error('IndexedDB open failed'));
      };
    });
    IndexedDbGateway.DB_PROMISES.set(dbName, promise);
    return promise;
  }
}
