import { Injectable } from '@rabstack/rab-api';
import { PackagePerformanceRow } from '@marathon/core';
import { db } from '@marathon-api/core';

@Injectable()
export class PackagePerformanceUseCase {
  async execute(): Promise<PackagePerformanceRow[]> {
    const packages = await db.package.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { participants: true } },
        participants: {
          where: { status: 'active' },
          select: { payment: { select: { amount: true, status: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return packages.map((pkg) => ({
      packageId: pkg.id,
      name: pkg.name,
      participants: pkg._count.participants,
      revenuePesewas: pkg.participants.reduce((sum, participant) => {
        if (participant.payment?.status === 'completed') {
          return sum + participant.payment.amount;
        }
        return sum;
      }, 0),
    }));
  }
}
