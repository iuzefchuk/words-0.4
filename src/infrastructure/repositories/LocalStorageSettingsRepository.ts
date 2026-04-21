import { GameSettings } from '@/application/types/index.ts';
import { SettingsRepository } from '@/application/types/repositories.ts';

type StoragePayload = { data: Partial<GameSettings>; timestamp: number };

export default class LocalStorageSettingsRepository implements SettingsRepository {
  private static readonly KEY = 'Settings';

  load(): null | Partial<GameSettings> {
    try {
      const raw = localStorage.getItem(LocalStorageSettingsRepository.KEY);
      if (raw === null) return null;
      const payload = JSON.parse(raw) as StoragePayload;
      return payload.data ?? null;
    } catch {
      localStorage.removeItem(LocalStorageSettingsRepository.KEY);
      return null;
    }
  }

  save(settings: Partial<GameSettings>): void {
    const existing = this.load() ?? {};
    const merged: Partial<GameSettings> = { ...existing, ...settings };
    const payload: StoragePayload = { data: merged, timestamp: Date.now() };
    localStorage.setItem(LocalStorageSettingsRepository.KEY, JSON.stringify(payload));
  }
}
