import { DictionaryRepository } from '@/application/types/repositories.ts';
import IndexedDbService from '@/infrastructure/services/IndexedDbService.ts';

export default class IndexedDbDictionaryRepository implements DictionaryRepository {
  private static readonly CACHE_KEY = 'state';

  private static readonly DB_NAME = 'words-dictionary';

  private static readonly STORE_NAME = 'dictionary';

  private readonly db = new IndexedDbService<string>(
    IndexedDbDictionaryRepository.DB_NAME,
    IndexedDbDictionaryRepository.STORE_NAME,
    IndexedDbDictionaryRepository.CACHE_KEY,
  );

  constructor(private readonly version: string) {}

  async load(): Promise<null | string> {
    return this.db.load(this.version);
  }

  async save(data: string): Promise<void> {
    await this.db.save(this.version, data);
  }
}
