import LocalStorageGateway from '@/infrastructure/gateways/LocalStorageGateway.ts';
import type { GameMatchSettings } from '@/application/types/index.ts';
import type { SettingsRepository } from '@/application/types/repositories.ts';

export default class LocalStorageSettingsRepository implements SettingsRepository {
  private static readonly KEY = 'settings';

  load(): null | Partial<GameMatchSettings> {
    return LocalStorageGateway.load(LocalStorageSettingsRepository.KEY) as null | Partial<GameMatchSettings>;
  }

  save(settings: Partial<GameMatchSettings>): void {
    const existing = this.load() ?? {};
    LocalStorageGateway.save(LocalStorageSettingsRepository.KEY, { ...existing, ...settings });
  }
}
