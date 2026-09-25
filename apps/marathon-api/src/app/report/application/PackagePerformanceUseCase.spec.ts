jest.mock('@marathon-api/core', () => ({
  db: { package: { findMany: jest.fn() } },
}));

import { db } from '@marathon-api/core';
import { PackagePerformanceUseCase } from './PackagePerformanceUseCase';

const mockDb = db as unknown as { package: { findMany: jest.Mock } };

describe('PackagePerformanceUseCase', () => {
  it('counts package revenue without the Weekend Package add-ons on the same payment', async () => {
    mockDb.package.findMany.mockResolvedValue([
      {
        id: 'pkg-10k',
        name: '10KM Run',
        _count: { participants: 3 },
        participants: [
          // race only
          { payment: { amount: 12000, addOnAmount: null, status: 'completed' } },
          // race + transport
          { payment: { amount: 37000, addOnAmount: 25000, status: 'completed' } },
          // still pending — not revenue yet
          { payment: { amount: 12000, addOnAmount: null, status: 'pending' } },
        ],
      },
    ]);

    const rows = await new PackagePerformanceUseCase().execute();

    expect(rows).toEqual([
      { packageId: 'pkg-10k', name: '10KM Run', participants: 3, revenuePesewas: 24000 },
    ]);
  });
});
