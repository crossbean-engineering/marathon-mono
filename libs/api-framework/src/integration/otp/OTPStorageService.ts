import { createHash, randomInt } from 'crypto';
import { RedisService } from '../redis/RedisService';

export type OTPProvider = 'email' | 'sms';

export type OTPSession = {
  sessionId: string;
  identifier: string;
  otp: string;
  provider: OTPProvider;
  attempts: number;
  createdAt: string;
  expiresAt: string;
};

export type OTPConfig = {
  otpLength: number;
  expiryMinutes: number;
  maxAttempts: number;
  cooldownMinutes: number;
};

const DEFAULT_OTP_CONFIG: OTPConfig = {
  otpLength: 6,
  expiryMinutes: 10,
  maxAttempts: 5,
  cooldownMinutes: 0.5,
};

const SESSION_PREFIX = 'otp:session:';
const COOLDOWN_PREFIX = 'otp:cooldown:';

export class OTPStorageService {
  private readonly config: OTPConfig;

  constructor(
    private readonly redis: RedisService,
    config?: Partial<OTPConfig>,
  ) {
    this.config = { ...DEFAULT_OTP_CONFIG, ...config };
  }

  generateOTP(): string {
    const min = Math.pow(10, this.config.otpLength - 1);
    const max = Math.pow(10, this.config.otpLength) - 1;
    return randomInt(min, max + 1).toString();
  }

  private hashOTP(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
  }

  private generateSessionId(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex');
  }

  async isInCooldown(identifier: string): Promise<boolean> {
    const cooldownKey = `${COOLDOWN_PREFIX}${identifier}`;
    return await this.redis.exists(cooldownKey);
  }

  private async setCooldown(identifier: string): Promise<void> {
    const cooldownKey = `${COOLDOWN_PREFIX}${identifier}`;
    const cooldownSeconds = this.config.cooldownMinutes * 60;
    await this.redis.set(cooldownKey, '1', cooldownSeconds);
  }

  async createSession(
    identifier: string,
    provider: OTPProvider,
  ): Promise<{ session: OTPSession; otp: string }> {
    const sessionId = this.generateSessionId();
    const otp = this.generateOTP();
    const hashedOTP = this.hashOTP(otp);

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + this.config.expiryMinutes * 60000,
    );

    const session: OTPSession = {
      sessionId,
      identifier,
      otp: hashedOTP,
      provider,
      attempts: 0,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const key = `${SESSION_PREFIX}${sessionId}`;
    const expirySeconds = this.config.expiryMinutes * 60;
    await this.redis.setJSON(key, session, expirySeconds);

    await this.setCooldown(identifier);

    return { session, otp };
  }

  async getSession(sessionId: string): Promise<OTPSession | null> {
    const key = `${SESSION_PREFIX}${sessionId}`;
    return await this.redis.getJSON<OTPSession>(key);
  }

  async verifyOTP(sessionId: string, otp: string): Promise<boolean> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return false;
    }

    if (new Date(session.expiresAt) < new Date()) {
      await this.deleteSession(sessionId);
      return false;
    }

    if (session.attempts >= this.config.maxAttempts) {
      await this.deleteSession(sessionId);
      return false;
    }

    session.attempts += 1;

    const hashedOTP = this.hashOTP(otp);
    const isValid = hashedOTP === session.otp;

    if (isValid) {
      return true;
    }

    const key = `${SESSION_PREFIX}${sessionId}`;
    const ttl = await this.redis.getClient().ttl(key);
    if (ttl > 0) {
      await this.redis.setJSON(key, session, ttl);
    }

    return false;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `${SESSION_PREFIX}${sessionId}`;
    await this.redis.del(key);
  }
}
