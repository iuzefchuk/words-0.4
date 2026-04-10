import { GameDictionarySnapshot, GameEvent } from '@/application/types/index.ts';

export type DictionaryRepository = {
  load(): Promise<GameDictionarySnapshot | null>;
  save(snapshot: GameDictionarySnapshot): Promise<void>;
};

export type EventRepository = {
  delete(): Promise<void>;
  load(): Promise<null | ReadonlyArray<GameEvent>>;
  save(events: ReadonlyArray<GameEvent>): Promise<void>;
};
