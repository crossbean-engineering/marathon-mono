import { Injectable } from '@rabstack/rab-api';
import { FinancialStats } from '@marathon/core';
import { db } from '@marathon-api/core';

@Injectable()
export class FinancialStatsUseCase {
  async execute(): Promise<FinancialStats> {
    const [byStatus, revenue] = await Promise.all([
      db.payment.groupBy({ by: ['status'], _count: { _all: true } }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'completed' },
      }),
    ]);

    const statusCount = (status: 'completed' | 'pending' | 'failed'): number =>
      byStatus.find((row) => row.status === status)?._count._all ?? 0;

    return {
      // Waived settlements are completed payments of 0, so they count toward
      // completedPayments without moving revenue.
      totalRevenuePesewas: revenue._sum.amount ?? 0,
      completedPayments: statusCount('completed'),
      pendingPayments: statusCount('pending'),
      failedPayments: statusCount('failed'),
    };
  }
}
