import { GameMatchSettings } from '@/application/types/index.ts';
import { SettingsRepository } from '@/application/types/repositories.ts';
import LocalStorage from '@/infrastructure/services/LocalStorage.ts';

export default class LocalStorageSettingsRepository implements SettingsRepository {
  private static readonly KEY = 'Settings';

  private readonly storage = new LocalStorage<Partial<GameMatchSettings>>(LocalStorageSettingsRepository.KEY);

  load(): null | Partial<GameMatchSettings> {
    return this.storage.load();
  }

  save(settings: Partial<GameMatchSettings>): void {
    const existing = this.storage.load() ?? {};
    this.storage.save({ ...existing, ...settings });
  }
}
