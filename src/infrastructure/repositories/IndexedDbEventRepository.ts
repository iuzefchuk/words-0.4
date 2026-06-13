import IndexedDbGateway from '@/infrastructure/gateways/IndexedDbGateway.ts';
import type { GameEvent } from '@/application/types/index.ts';
import type { EventRepository } from '@/application/types/repositories.ts';

export default class IndexedDbEventRepository implements EventRepository {
  private static readonly DB_NAME = 'events';

  private persistedEventsCount = 0;

  constructor(private readonly eventsSchemaVersion: number) {}

  async append(events: ReadonlyArray<GameEvent>): Promise<void> {
    const previousCount = this.persistedEventsCount;
    // claim the range synchronously so back-to-back fire-and-forget calls don't double-write.
    this.persistedEventsCount = events.length;
    if (events.length < previousCount) {
      await IndexedDbGateway.delete(IndexedDbEventRepository.DB_NAME);
      await IndexedDbGateway.append(IndexedDbEventRepository.DB_NAME, this.eventsSchemaVersion, [...events]);
      return;
    }
    await IndexedDbGateway.append(IndexedDbEventRepository.DB_NAME, this.eventsSchemaVersion, events.slice(previousCount));
  }

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
}
