import { IdGenerator } from '@/domain/types.ts';

export default class CryptoIdGenerator implements IdGenerator {
  execute(): string {
    return crypto.randomUUID();
  }
}
