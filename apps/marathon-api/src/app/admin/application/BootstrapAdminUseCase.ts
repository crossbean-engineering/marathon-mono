import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@rabstack/rab-api';
import { BaseUser, BootstrapAdminBody, ErrorCode } from '@marathon/core';
import { db, MarathonApiMeta } from '@marathon-api/core';
import { UserSelect, mapUser } from './lib';

export type BootstrapAdminUseCaseParams = { payload: BootstrapAdminBody };

@Injectable()
export class BootstrapAdminUseCase {
  async execute(params: BootstrapAdminUseCaseParams): Promise<BaseUser> {
    const { secret, firstName, lastName, phone, email } = params.payload;

    if (!MarathonApiMeta.adminSecretKey || secret !== MarathonApiMeta.adminSecretKey) {
      throw new ForbiddenException(
        'Invalid bootstrap secret',
        ErrorCode.FORBIDDEN,
      );
    }

    const existing = await db.user.findFirst({ where: { role: 'admin' } });
    if (existing) {
      throw new BadRequestException(
        'Admin already exists',
        undefined,
        ErrorCode.USER_ALREADY_EXISTS,
      );
    }

    const phoneTaken = await db.user.findUnique({ where: { phone } });
    if (phoneTaken) {
      throw new BadRequestException(
        'An account with this phone already exists',
        undefined,
        ErrorCode.USER_ALREADY_EXISTS,
      );
    }

    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        phone,
        email: email ? email.toLowerCase() : undefined,
        role: 'admin',
        status: 'active',
        isPhoneVerified: true,
      },
      select: UserSelect,
    });

    return mapUser(user);
  }
}
