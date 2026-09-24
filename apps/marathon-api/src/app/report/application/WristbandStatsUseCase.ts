import { Injectable } from '@rabstack/rab-api';
import { WristbandStats } from '@marathon/core';
import { db } from '@marathon-api/core';

@Injectable()
export class WristbandStatsUseCase {
  async execute(): Promise<WristbandStats> {
    const [byStatus, assigned] = await Promise.all([
      db.wristband.groupBy({ by: ['status'], _count: { _all: true } }),
      db.wristband.count({ where: { participantId: { not: null } } }),
    ]);

    const statusCount = (
      status: 'available' | 'redeemed' | 'disabled',
    ): number => byStatus.find((row) => row.status === status)?._count._all ?? 0;

    const available = statusCount('available');
    const redeemed = statusCount('redeemed');
    const disabled = statusCount('disabled');

    return {
      total: available + redeemed + disabled,
      available,
      redeemed,
      disabled,
      assigned,
    };
  }
}
