import { Injectable } from '@rabstack/rab-api';
import {
  OTPStorageService as BaseOTPStorageService,
  OTPProvider,
} from '@api/framework';
import { RedisService } from '@marathon-api/integration';
import { MarathonApiMeta } from '@marathon-api/core';

const DEV_OTP_PREFIX = 'otp:dev:';

@Injectable()
export class OTPStorageService extends BaseOTPStorageService {
  constructor(private readonly redisService: RedisService) {
    super(redisService);
  }

  override async createSession(identifier: string, provider: OTPProvider) {
    const result = await super.createSession(identifier, provider);

    if (MarathonApiMeta.isDevelopment) {
      const key = `${DEV_OTP_PREFIX}${result.session.sessionId}`;
      await this.redisService.set(key, result.otp, 600);
    }

    return result;
  }
}
