import { ErrorCode } from '@marathon/core';

jest.mock('@marathon-api/core', () => ({
  MarathonApiMeta: {},
  db: {
    user: { findUnique: jest.fn() },
    participantAddOn: { findMany: jest.fn() },
    addOn: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock('@marathon-api/integration', () => ({
  QueueService: { addNotificationJob: jest.fn() },
}));
jest.mock('@marathon-api/app/coupon', () => ({ ApplyCouponUseCase: class {} }));
jest.mock('./purchaseContext', () => ({
  resolveNewParticipant: jest.fn(),
  resolveExistingParticipant: jest.fn(),
}));

import { db } from '@marathon-api/core';
import { resolveExistingParticipant } from './purchaseContext';
import { ClaimFreePackageUseCase } from './ClaimFreePackageUseCase';

const mockDb = db as unknown as {
  user: { findUnique: jest.Mock };
  participantAddOn: { findMany: jest.Mock };
  addOn: { findMany: jest.Mock };
  $transaction: jest.Mock;
};

const applyCoupon = { execute: jest.fn() };
const useCase = new ClaimFreePackageUseCase(applyCoupon as any);

beforeEach(() => {
  jest.resetAllMocks();
  mockDb.user.findUnique.mockResolvedValue({ id: 'user-1', email: null });
  (resolveExistingParticipant as jest.Mock).mockResolvedValue({
    packageId: 'pkg-10k',
    packageName: '10KM Run',
    price: 12000,
    customerName: 'Runner One',
    existingParticipantId: 'participant-1',
  });
  applyCoupon.execute.mockResolvedValue({
    couponId: 'coupon-1',
    couponCode: 'FREE',
    percentOff: 100,
    originalAmount: 12000,
    discountAmount: 12000,
    netAmount: 0,
  });
});

describe('ClaimFreePackageUseCase — Weekend Package add-ons', () => {
  it('refuses to waive a retried participant who still owes for add-ons', async () => {
    mockDb.participantAddOn.findMany.mockResolvedValue([
      { addOnId: 'return-bus', participant: { status: 'suspended' } },
    ]);
    mockDb.addOn.findMany.mockResolvedValue([
      {
        id: 'return-bus',
        type: 'transport',
        name: 'Return group transport',
        provider: null,
        description: null,
        occupancy: null,
        price: 25000,
        capacity: null,
        isActive: true,
        createdAt: new Date(),
        _count: { bookings: 0 },
      },
    ]);

    await expect(
      useCase.execute({
        payload: { participantId: 'participant-1', couponCode: 'FREE' },
        userId: 'user-1',
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.COUPON_NOT_APPLICABLE });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it('settles a retried participant with no add-ons', async () => {
    mockDb.participantAddOn.findMany.mockResolvedValue([]);
    const tx = {
      payment: {
        create: jest.fn().mockResolvedValue({
          id: 'payment-1',
          orderId: 'order-1',
          transactionId: 'txn-1',
        }),
      },
      participant: {
        update: jest.fn().mockResolvedValue({
          id: 'participant-1',
          name: 'Runner One',
          code: 'CODE1',
          ic: null,
          shirtSize: 'm',
          gender: null,
          status: 'active',
          runnerNumber: null,
          checkinDate: null,
          userId: 'user-1',
          packageId: 'pkg-10k',
          paymentId: 'payment-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    };
    mockDb.$transaction.mockImplementation((fn: (t: typeof tx) => unknown) => fn(tx));

    const result = await useCase.execute({
      payload: { participantId: 'participant-1', couponCode: 'FREE' },
      userId: 'user-1',
    });

    expect(result.payment.status).toBe('completed');
    expect(tx.payment.create.mock.calls[0][0].data.amount).toBe(0);
  });
});
