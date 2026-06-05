import type { GameEvent, GameMatchSettings } from '@/app/types/index.ts';

export type AppEventsRepository = {
  delete(): Promise<void>;
  load(): Promise<null | ReadonlyArray<GameEvent>>;
  save(events: ReadonlyArray<GameEvent>): Promise<void>;
};

export type AppRepositories = {
  events: AppEventsRepository;
  settings: AppSettingsRepository;
};

export type AppSettingsRepository = {
  load(): null | Partial<GameMatchSettings>;
  save(settings: Partial<GameMatchSettings>): void;
};
