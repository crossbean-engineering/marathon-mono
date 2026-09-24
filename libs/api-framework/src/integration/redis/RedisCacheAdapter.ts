import { RedisService } from './RedisService';

export class RedisCacheAdapter {
  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    return this.redis.getJSON<T>(key);
  }

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    await this.redis.setJSON(key, data, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    const pattern = `*${key}*`;
    const keys = await this.redis.scan(pattern);
    if (keys.length > 0) {
      await this.redis.delMultiple(keys);
    }
  }
}
