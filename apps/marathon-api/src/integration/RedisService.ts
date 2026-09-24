import { Injectable } from '@rabstack/rab-api';
import { RedisService as BaseRedisService } from '@api/framework';
import { MarathonApiMeta } from '@marathon-api/core';

@Injectable()
export class RedisService extends BaseRedisService {
  constructor() {
    super(MarathonApiMeta.redis);
  }
}
