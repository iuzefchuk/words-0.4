import LocalStorageGateway from '@/infrastructure/gateways/LocalStorageGateway.ts';
import type { DomainMatchSettings } from '@/app/types/index.ts';
import type { AppSettingsRepository } from '@/app/types/repositories.ts';

export default class LocalStorageSettingsRepository implements AppSettingsRepository {
  private static readonly KEY = 'settings';

  load(): null | Partial<DomainMatchSettings> {
    return LocalStorageGateway.load(LocalStorageSettingsRepository.KEY) as null | Partial<DomainMatchSettings>;
  }

  save(settings: Partial<DomainMatchSettings>): void {
    const existing = this.load() ?? {};
    LocalStorageGateway.save(LocalStorageSettingsRepository.KEY, { ...existing, ...settings });
  }
}
