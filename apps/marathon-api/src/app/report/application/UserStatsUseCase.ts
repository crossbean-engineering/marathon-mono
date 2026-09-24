import { Injectable } from '@rabstack/rab-api';
import { UserStats } from '@marathon/core';
import { db } from '@marathon-api/core';

@Injectable()
export class UserStatsUseCase {
  async execute(): Promise<UserStats> {
    return { totalUsers: await db.user.count() };
  }
}
