import { GameEvent, GameMatchSettings } from '@/application/types/index.ts';

export type EventRepository = {
  append(events: ReadonlyArray<GameEvent>): Promise<void>;
  delete(): Promise<void>;
  load(): Promise<null | ReadonlyArray<GameEvent>>;
};

export type SettingsRepository = {
  load(): null | Partial<GameMatchSettings>;
  save(settings: Partial<GameMatchSettings>): void;
};
