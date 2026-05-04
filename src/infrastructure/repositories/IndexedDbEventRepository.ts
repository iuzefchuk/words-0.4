import { GameEvent } from '@/application/types/index.ts';
import { EventRepository } from '@/application/types/repositories.ts';
import IndexedDbService from '@/infrastructure/services/IndexedDbService.ts';

export default class IndexedDbEventRepository implements EventRepository {
  private static readonly DB_NAME = 'words';

  private static readonly EVENTS_STORE = 'events';

  private static readonly META_STORE = 'meta';

  private readonly db = new IndexedDbService<GameEvent>(
    IndexedDbEventRepository.DB_NAME,
    IndexedDbEventRepository.EVENTS_STORE,
    IndexedDbEventRepository.META_STORE,
  );

  private persistedCount = 0;

  constructor(private readonly appVersion: string) {}

  async append(events: ReadonlyArray<GameEvent>): Promise<void> {
    const start = this.persistedCount;
    // Claim the range synchronously so back-to-back fire-and-forget calls don't double-write.
    this.persistedCount = events.length;
    await this.db.append(this.appVersion, events.slice(start));
  }

  async delete(): Promise<void> {
    this.persistedCount = 0;
    await this.db.delete();
  }

  async load(): Promise<null | ReadonlyArray<GameEvent>> {
    const events = await this.db.load(this.appVersion);
    this.persistedCount = events?.length ?? 0;
    return events;
  }
}
