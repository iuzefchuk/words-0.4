import type { DomainMatchSettings, DomainTimelineEvent } from '@/app/types/index.ts';

export type AppEventsRepository = {
  delete(): Promise<void>;
  load(): Promise<null | ReadonlyArray<DomainTimelineEvent>>;
  save(events: ReadonlyArray<DomainTimelineEvent>): Promise<void>;
};

export type AppRepositories = {
  events: AppEventsRepository;
  settings: AppSettingsRepository;
};

export type AppSettingsRepository = {
  load(): null | Partial<DomainMatchSettings>;
  save(settings: Partial<DomainMatchSettings>): void;
};
