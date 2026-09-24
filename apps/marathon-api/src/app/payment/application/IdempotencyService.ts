import { Injectable } from '@rabstack/rab-api';
import { RedisService } from '@marathon-api/integration';

/**
 * Caches a buyPackage response by a client-supplied idempotency key so a retry
 * or double-submit returns the original result instead of creating a duplicate
 * participant + double Mojo charge. Mirrors gift-registry's IdempotencyService.
 */
@Injectable()
export class IdempotencyService {
  private readonly TTL = 86400; // 24h
  private readonly PREFIX = 'idempotency:buy-package';

  constructor(private readonly redis: RedisService) {}

  async getResult<T>(key: string): Promise<T | null> {
    return this.redis.getJSON<T>(`${this.PREFIX}:${key}`);
  }

  async storeResult<T>(key: string, result: T): Promise<void> {
    await this.redis.setJSON(`${this.PREFIX}:${key}`, result, this.TTL);
  }
}
