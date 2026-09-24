import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@rabstack/rab-api';
import { LoginBody, AuthResponse, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { SessionFactory } from './SessionFactory';

export type LoginUseCaseParams = { payload: LoginBody };

@Injectable()
export class LoginUseCase {
  constructor(private sessionFactory: SessionFactory) {}

  async execute(params: LoginUseCaseParams): Promise<AuthResponse> {
    const user = await db.user.findUnique({
      where: { phone: params.payload.phone },
    });
    if (!user) {
      throw new NotFoundException(
        'No account for this phone',
        ErrorCode.USER_NOT_FOUND,
      );
    }
    if (user.status === 'suspended') {
      throw new BadRequestException(
        'Account suspended',
        undefined,
        ErrorCode.USER_SUSPENDED,
      );
    }
    return this.sessionFactory.build(user);
  }
}
