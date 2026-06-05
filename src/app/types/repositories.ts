import type { GameEvent, GameMatchSettings } from '@/app/types/index.ts';

export type AppRepositories = {
  events: EventRepository;
  settings: SettingsRepository;
};

export type EventRepository = {
  delete(): Promise<void>;
  load(): Promise<null | ReadonlyArray<GameEvent>>;
  save(events: ReadonlyArray<GameEvent>): Promise<void>;
};

export type SettingsRepository = {
  load(): null | Partial<GameMatchSettings>;
  save(settings: Partial<GameMatchSettings>): void;
};
