import { GameEvent } from '@/application/types/index.ts';

export type EventRepository = {
  delete(): Promise<void>;
  load(): Promise<null | ReadonlyArray<GameEvent>>;
  save(events: ReadonlyArray<GameEvent>): Promise<void>;
};
