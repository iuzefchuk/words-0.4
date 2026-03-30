type StoragePayload = { timestamp: number; data: unknown };

export default class LocalStorage {
  static load(key: string, expireMs: number = 0): unknown | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      const payload: StoragePayload = JSON.parse(raw);
      if (this.isPayloadExpired(expireMs, payload.timestamp)) {
        localStorage.removeItem(key);
        return null;
      }
      return payload.data;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  static save(key: string, data: unknown): void {
    const payload: StoragePayload = { timestamp: Date.now(), data };
    localStorage.setItem(key, JSON.stringify(payload));
  }

  static delete(key: string): void {
    localStorage.removeItem(key);
  }

  private static isPayloadExpired(expireMs: number, timestamp: number): boolean {
    return expireMs > 0 && Date.now() > timestamp + expireMs;
  }
}
