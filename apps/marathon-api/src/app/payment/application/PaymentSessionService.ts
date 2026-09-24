import { Injectable } from '@rabstack/rab-api';
import { randomUUID } from 'crypto';
import { RedisService } from '@marathon-api/integration';

interface PaymentSession {
  userId: string;
  momoNumber: string;
}

/**
 * Short-lived token, minted after a successful OTP verification, that lets a
 * user pay again from the same momo number without re-verifying OTP for 10 min.
 * Bound to userId + momoNumber (mirrors gift-registry's PaymentSessionService).
 */
@Injectable()
export class PaymentSessionService {
  private readonly TTL = 600; // 10 min
  private readonly PREFIX = 'payment_session:buy-package';

  constructor(private readonly redis: RedisService) {}

  async issue(userId: string, momoNumber: string): Promise<string> {
    const token = randomUUID();
    await this.redis.setJSON(
      `${this.PREFIX}:${token}`,
      { userId, momoNumber },
      this.TTL,
    );
    return token;
  }

  async validate(
    token: string,
    userId: string,
    momoNumber: string,
  ): Promise<boolean> {
    const session = await this.redis.getJSON<PaymentSession>(
      `${this.PREFIX}:${token}`,
    );
    if (!session) return false;
    return session.userId === userId && session.momoNumber === momoNumber;
  }

  async invalidate(token: string): Promise<void> {
    await this.redis.del(`${this.PREFIX}:${token}`);
  }
}
