import LocalStorageGateway from '@/infrastructure/gateways/LocalStorageGateway.ts';
import type { GameMatchSettings } from '@/app/types/index.ts';
import type { AppSettingsRepository } from '@/app/types/repositories.ts';

export default class LocalStorageSettingsRepository implements AppSettingsRepository {
  private static readonly KEY = 'settings';

  load(): null | Partial<GameMatchSettings> {
    return LocalStorageGateway.load(LocalStorageSettingsRepository.KEY) as null | Partial<GameMatchSettings>;
  }

  save(settings: Partial<GameMatchSettings>): void {
    const existing = this.load() ?? {};
    LocalStorageGateway.save(LocalStorageSettingsRepository.KEY, { ...existing, ...settings });
  }
}
