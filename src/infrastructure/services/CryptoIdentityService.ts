import { IdentityService } from '@/application/types/ports.ts';

export default class CryptoIdentityService implements IdentityService {
  createUniqueId(): string {
    return crypto.randomUUID();
  }
}
