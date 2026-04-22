import { GameEvent, GameMatchSettings } from '@/application/types/index.ts';

export type EventRepository = {
  delete(): Promise<void>;
  load(): Promise<null | ReadonlyArray<GameEvent>>;
  save(events: ReadonlyArray<GameEvent>): Promise<void>;
};

export type SettingsRepository = {
  load(): null | Partial<GameMatchSettings>;
  save(settings: Partial<GameMatchSettings>): void;
};
