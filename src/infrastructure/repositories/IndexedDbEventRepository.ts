import { GameEvent } from '@/application/types/index.ts';
import { EventRepository } from '@/application/types/repositories.ts';
import IndexedDbService from '@/infrastructure/services/IndexedDbService.ts';

export default class IndexedDbEventRepository implements EventRepository {
  private static readonly CACHE_KEY = 'state';

  private static readonly DB_NAME = 'words-events';

  private static readonly STORE_NAME = 'events';

  private readonly db = new IndexedDbService<ReadonlyArray<GameEvent>>(
    IndexedDbEventRepository.DB_NAME,
    IndexedDbEventRepository.STORE_NAME,
    IndexedDbEventRepository.CACHE_KEY,
  );

  constructor(private readonly version: string) {}

  async delete(): Promise<void> {
    await this.db.delete();
  }

  async load(): Promise<null | ReadonlyArray<GameEvent>> {
    return this.db.load(this.version);
  }

  async save(events: ReadonlyArray<GameEvent>): Promise<void> {
    await this.db.save(this.version, events);
  }
}
