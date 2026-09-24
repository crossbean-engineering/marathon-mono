import { BadRequestException, Injectable } from '@rabstack/rab-api';
import { AddAdminUserBody, BaseUser, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { UserSelect, mapUser } from './lib';

export type AddAdminUserUseCaseParams = { payload: AddAdminUserBody };

@Injectable()
export class AddAdminUserUseCase {
  async execute(params: AddAdminUserUseCaseParams): Promise<BaseUser> {
    const { firstName, lastName, phone, email, role } = params.payload;

    if (role !== 'admin' && role !== 'agent') {
      throw new BadRequestException(
        'Role must be either admin or agent',
        undefined,
        ErrorCode.INVALID_INPUT,
      );
    }

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
        role,
        status: 'active',
        isPhoneVerified: true,
      },
      select: UserSelect,
    });

    return mapUser(user);
  }
}
