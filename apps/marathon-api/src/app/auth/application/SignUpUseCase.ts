import { BadRequestException, Injectable } from '@rabstack/rab-api';
import { SignUpBody, AuthResponse, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { QueueService } from '@marathon-api/integration';
import { SessionFactory } from './SessionFactory';

export type SignUpUseCaseParams = { payload: SignUpBody };

@Injectable()
export class SignUpUseCase {
  constructor(private sessionFactory: SessionFactory) {}

  async execute(params: SignUpUseCaseParams): Promise<AuthResponse> {
    const { firstName, lastName, phone, email, idNumber, location } =
      params.payload;

    const existing = await db.user.findUnique({ where: { phone } });
    if (existing) {
      throw new BadRequestException(
        'An account with this phone already exists',
        undefined,
        ErrorCode.USER_ALREADY_EXISTS,
      );
    }
    if (email) {
      const emailTaken = await db.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (emailTaken) {
        throw new BadRequestException(
          'An account with this email already exists',
          undefined,
          ErrorCode.USER_ALREADY_EXISTS,
        );
      }
    }

    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        phone,
        email: email ? email.toLowerCase() : undefined,
        idNumber,
        location,
        role: 'user',
        status: 'active',
        isPhoneVerified: true,
      },
    });

    try {
      await QueueService.addNotificationJob({
        type: 'account-setup',
        userId: user.id,
        providers: user.email ? ['email', 'sms'] : ['sms'],
      });
    } catch (e) {
      console.error('Failed to enqueue account-setup notification', e);
    }

    return this.sessionFactory.build(user);
  }
}
