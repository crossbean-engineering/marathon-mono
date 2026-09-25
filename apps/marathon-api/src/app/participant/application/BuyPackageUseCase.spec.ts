import { BuyPackageBody, ErrorCode } from '@marathon/core';

const tx = {
  payment: { create: jest.fn() },
  participant: { create: jest.fn(), update: jest.fn() },
};

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
  QueueService: { addPaymentVerification: jest.fn() },
}));
// Only their types are used — instances are injected below.
jest.mock('@marathon-api/app/payment', () => ({ PaymentProcessor: class {} }));
jest.mock('@marathon-api/app/coupon', () => ({ ApplyCouponUseCase: class {} }));
jest.mock('./purchaseContext', () => ({
  resolveNewParticipant: jest.fn(),
  resolveExistingParticipant: jest.fn(),
}));

import { db } from '@marathon-api/core';
import { resolveExistingParticipant, resolveNewParticipant } from './purchaseContext';
import { BuyPackageUseCase } from './BuyPackageUseCase';

const mockDb = db as unknown as {
  user: { findUnique: jest.Mock };
  participantAddOn: { findMany: jest.Mock };
  addOn: { findMany: jest.Mock };
  $transaction: jest.Mock;
};

const processor = { execute: jest.fn() };
const applyCoupon = { execute: jest.fn() };
const useCase = new BuyPackageUseCase(processor as any, applyCoupon as any);

const TEN_K = 12000; // 120 GHS, pesewas

const addOnRow = (id: string, type: 'accommodation' | 'transport', price: number) => ({
  id,
  type,
  name: id,
  provider: null,
  description: null,
  occupancy: type === 'accommodation' ? 2 : null,
  price,
  capacity: null,
  isActive: true,
  createdAt: new Date(),
  _count: { bookings: 0 },
});

const participantRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'participant-1',
  name: 'Runner One',
  code: 'CODE1',
  ic: null,
  shirtSize: 'm',
  gender: 'female',
  status: 'pending',
  runnerNumber: null,
  checkinDate: null,
  userId: 'user-1',
  packageId: 'pkg-10k',
  paymentId: 'payment-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const body = (overrides: Partial<BuyPackageBody> = {}): BuyPackageBody => ({
  packageId: 'pkg-10k',
  participant: { name: 'Runner One', shirtSize: 'm', gender: 'female' },
  payment: { momoNumber: '233240000000', network: 'MTN' },
  ...overrides,
});

beforeEach(() => {
  jest.resetAllMocks();
  mockDb.user.findUnique.mockResolvedValue({ id: 'user-1' });
  mockDb.participantAddOn.findMany.mockResolvedValue([]);
  mockDb.addOn.findMany.mockResolvedValue([
    addOnRow('kod-double', 'accommodation', 22500),
    addOnRow('return-bus', 'transport', 25000),
  ]);
  mockDb.$transaction.mockImplementation((fn: (t: typeof tx) => unknown) => fn(tx));
  (resolveNewParticipant as jest.Mock).mockResolvedValue({
    packageId: 'pkg-10k',
    packageName: '10KM Run',
    price: TEN_K,
    customerName: 'Runner One',
  });
  processor.execute.mockResolvedValue({
    orderId: 'order-1',
    transactionId: 'txn-1',
    request: {},
    response: {},
  });
  tx.payment.create.mockImplementation(({ data }) =>
    Promise.resolve({ id: 'payment-1', ...data }),
  );
  tx.participant.create.mockResolvedValue(participantRow());
  tx.participant.update.mockResolvedValue(participantRow());
});

describe('BuyPackageUseCase — Weekend Package add-ons', () => {
  it('charges the race price alone when no add-ons are booked', async () => {
    const result = await useCase.execute({ payload: body(), userId: 'user-1' });

    expect(processor.execute).toHaveBeenCalledWith(
      expect.objectContaining({ amount: TEN_K, orderDescription: 'Package: 10KM Run' }),
    );
    expect(tx.payment.create.mock.calls[0][0].data).toMatchObject({
      amount: TEN_K,
      addOnAmount: null,
    });
    expect(tx.participant.create.mock.calls[0][0].data.addOns).toEqual({ create: [] });
    expect(result.payment.addOnAmount).toBeUndefined();
  });

  it('charges race + stay + transport for the Full Package and books both', async () => {
    const result = await useCase.execute({
      payload: body({ addOnIds: ['kod-double', 'return-bus'] }),
      userId: 'user-1',
    });

    const total = TEN_K + 22500 + 25000;
    expect(processor.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: total,
        orderDescription: 'Package: 10KM Run + Weekend Package',
      }),
    );
    expect(tx.payment.create.mock.calls[0][0].data).toMatchObject({
      amount: total,
      addOnAmount: 47500,
    });
    expect(tx.participant.create.mock.calls[0][0].data.addOns).toEqual({
      create: [
        { addOnId: 'kod-double', price: 22500 },
        { addOnId: 'return-bus', price: 25000 },
      ],
    });
    expect(result.payment.addOnAmount).toBe(47500);
  });

  it('applies a coupon to the race price only, not the add-ons', async () => {
    applyCoupon.execute.mockResolvedValue({
      couponId: 'coupon-1',
      couponCode: 'HALF',
      percentOff: 50,
      originalAmount: TEN_K,
      discountAmount: 6000,
      netAmount: 6000,
    });

    await useCase.execute({
      payload: body({ addOnIds: ['return-bus'], couponCode: 'HALF' }),
      userId: 'user-1',
    });

    expect(processor.execute).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 6000 + 25000 }),
    );
    expect(tx.payment.create.mock.calls[0][0].data).toMatchObject({
      originalAmount: TEN_K,
      discountAmount: 6000,
      addOnAmount: 25000,
    });
  });

  it('charges just the add-ons when a coupon makes the race free', async () => {
    applyCoupon.execute.mockResolvedValue({
      couponId: 'coupon-1',
      couponCode: 'FREE',
      percentOff: 100,
      originalAmount: TEN_K,
      discountAmount: TEN_K,
      netAmount: 0,
    });

    await useCase.execute({
      payload: body({ addOnIds: ['return-bus'], couponCode: 'FREE' }),
      userId: 'user-1',
    });

    expect(processor.execute).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 25000 }),
    );
  });

  it('sends a free race with no add-ons to /participants/claim', async () => {
    applyCoupon.execute.mockResolvedValue({
      couponId: 'coupon-1',
      couponCode: 'FREE',
      percentOff: 100,
      originalAmount: TEN_K,
      discountAmount: TEN_K,
      netAmount: 0,
    });

    await expect(
      useCase.execute({ payload: body({ couponCode: 'FREE' }), userId: 'user-1' }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.COUPON_NOT_APPLICABLE });
    expect(processor.execute).not.toHaveBeenCalled();
  });

  it('rejects an invalid selection before charging anything', async () => {
    await expect(
      useCase.execute({
        payload: body({ addOnIds: ['kod-double', 'kod-double', 'missing'] }),
        userId: 'user-1',
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.ADD_ON_NOT_FOUND });
    expect(processor.execute).not.toHaveBeenCalled();
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it('replaces a retried participant’s bookings with the new selection', async () => {
    (resolveExistingParticipant as jest.Mock).mockResolvedValue({
      packageId: 'pkg-10k',
      packageName: '10KM Run',
      price: TEN_K,
      customerName: 'Runner One',
      existingParticipantId: 'participant-1',
    });
    mockDb.participantAddOn.findMany.mockResolvedValue([
      { addOnId: 'kod-double', participant: { status: 'suspended' } },
    ]);

    await useCase.execute({
      payload: {
        participantId: 'participant-1',
        addOnIds: ['return-bus'],
        payment: { momoNumber: '233240000000', network: 'MTN' },
      },
      userId: 'user-1',
    });

    expect(processor.execute).toHaveBeenCalledWith(
      expect.objectContaining({ amount: TEN_K + 25000 }),
    );
    expect(tx.participant.update.mock.calls[0][0].data.addOns).toEqual({
      deleteMany: {},
      create: [{ addOnId: 'return-bus', price: 25000 }],
    });
  });
});
