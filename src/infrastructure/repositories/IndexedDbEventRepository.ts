import IndexedDbGateway from '@/infrastructure/gateways/IndexedDbGateway.ts';
import type { GameEvent } from '@/app/types/index.ts';
import type { AppEventsRepository } from '@/app/types/repositories.ts';

export default class IndexedDbEventRepository implements AppEventsRepository {
  private static readonly DB_NAME = 'events';

  private persistedEventsCount = 0;

  constructor(private readonly eventsSchemaVersion: number) {}

  async delete(): Promise<void> {
    this.persistedEventsCount = 0;
    await IndexedDbGateway.delete(IndexedDbEventRepository.DB_NAME);
  }

  async load(): Promise<null | ReadonlyArray<GameEvent>> {
    const events = (await IndexedDbGateway.load(
      IndexedDbEventRepository.DB_NAME,
      this.eventsSchemaVersion,
    )) as null | ReadonlyArray<GameEvent>;
    this.persistedEventsCount = events?.length ?? 0;
    return events;
  }

  async save(events: ReadonlyArray<GameEvent>): Promise<void> {
    const start = this.persistedEventsCount;
    // claim the range synchronously so back-to-back fire-and-forget calls don't double-write.
    this.persistedEventsCount = events.length;
    await IndexedDbGateway.append(IndexedDbEventRepository.DB_NAME, this.eventsSchemaVersion, events.slice(start));
  }
}
