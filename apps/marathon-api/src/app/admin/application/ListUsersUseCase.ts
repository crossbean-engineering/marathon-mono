import { Injectable } from '@rabstack/rab-api';
import { BaseUser, UserRole } from '@marathon/core';
import { db } from '@marathon-api/core';
import { UserSelect, mapUser } from './lib';

export type ListUsersUseCaseParams = {
  role?: UserRole;
};

@Injectable()
export class ListUsersUseCase {
  async execute(params: ListUsersUseCaseParams): Promise<BaseUser[]> {
    const rows = await db.user.findMany({
      where: { role: params.role },
      orderBy: { createdAt: 'desc' },
      select: UserSelect,
    });

    return rows.map(mapUser);
  }
}
