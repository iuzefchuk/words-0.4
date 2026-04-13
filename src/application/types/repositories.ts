import { GameEvent } from '@/application/types/index.ts';

export type DictionaryRepository = {
  load(): Promise<null | string>;
  save(data: string): Promise<void>;
};

export type EventRepository = {
  delete(): Promise<void>;
  load(): Promise<null | ReadonlyArray<GameEvent>>;
  save(events: ReadonlyArray<GameEvent>): Promise<void>;
};
