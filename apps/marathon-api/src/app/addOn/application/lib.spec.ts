import { ErrorCode } from '@marathon/core';

jest.mock('@marathon-api/core', () => ({
  db: {
    participantAddOn: { findMany: jest.fn() },
    addOn: { findMany: jest.fn() },
  },
}));

import { db } from '@marathon-api/core';
import {
  describeAddOn,
  mapAddOn,
  resolvePurchaseAddOns,
  AddOnFromDB,
} from './lib';

const mockDb = db as unknown as {
  participantAddOn: { findMany: jest.Mock };
  addOn: { findMany: jest.Mock };
};

const addOnRow = (overrides: Partial<AddOnFromDB> = {}): AddOnFromDB => ({
  id: 'kod-double',
  type: 'accommodation',
  name: 'Double room',
  provider: 'KOD Apartment',
  description: null,
  occupancy: 2,
  price: 22500,
  capacity: null,
  isActive: true,
  createdAt: new Date('2026-09-25T00:00:00Z'),
  _count: { bookings: 0 },
  ...overrides,
});

const busRow = addOnRow({
  id: 'return-bus',
  type: 'transport',
  name: 'Return group transport',
  provider: null,
  occupancy: null,
  price: 25000,
});

beforeEach(() => {
  jest.resetAllMocks();
  mockDb.participantAddOn.findMany.mockResolvedValue([]);
  mockDb.addOn.findMany.mockResolvedValue([]);
});

describe('resolvePurchaseAddOns', () => {
  it('books nothing and skips the database when no add-ons are requested', async () => {
    await expect(resolvePurchaseAddOns(undefined)).resolves.toEqual({
      lines: [],
      total: 0,
    });
    await expect(resolvePurchaseAddOns([])).resolves.toEqual({
      lines: [],
      total: 0,
    });
    expect(mockDb.addOn.findMany).not.toHaveBeenCalled();
  });

  it('prices a new Full Package registration (stay + transport)', async () => {
    mockDb.addOn.findMany.mockResolvedValue([addOnRow(), busRow]);

    const resolved = await resolvePurchaseAddOns(['kod-double', 'return-bus']);

    expect(resolved).toEqual({
      lines: [
        { addOnId: 'kod-double', price: 22500 },
        { addOnId: 'return-bus', price: 25000 },
      ],
      total: 47500,
    });
    expect(mockDb.participantAddOn.findMany).not.toHaveBeenCalled();
  });

  it('keeps a retried participant’s add-ons when addOnIds is omitted', async () => {
    mockDb.participantAddOn.findMany.mockResolvedValue([
      { addOnId: 'return-bus', participant: { status: 'pending' } },
    ]);
    mockDb.addOn.findMany.mockResolvedValue([busRow]);

    const resolved = await resolvePurchaseAddOns(undefined, 'participant-1');

    expect(mockDb.participantAddOn.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { participantId: 'participant-1' } }),
    );
    expect(resolved.total).toBe(25000);
  });

  it('lets a retry drop its add-ons with an empty list', async () => {
    mockDb.participantAddOn.findMany.mockResolvedValue([
      { addOnId: 'return-bus', participant: { status: 'pending' } },
    ]);

    await expect(resolvePurchaseAddOns([], 'participant-1')).resolves.toEqual({
      lines: [],
      total: 0,
    });
  });

  it('lets a pending participant keep a spot in a now-full, deactivated room', async () => {
    mockDb.participantAddOn.findMany.mockResolvedValue([
      { addOnId: 'kod-double', participant: { status: 'pending' } },
    ]);
    mockDb.addOn.findMany.mockResolvedValue([
      addOnRow({ isActive: false, capacity: 2, _count: { bookings: 2 } }),
    ]);

    const resolved = await resolvePurchaseAddOns(undefined, 'participant-1');
    expect(resolved.total).toBe(22500);
  });

  it('re-checks capacity for a suspended participant — their spot was released', async () => {
    mockDb.participantAddOn.findMany.mockResolvedValue([
      { addOnId: 'kod-double', participant: { status: 'suspended' } },
    ]);
    mockDb.addOn.findMany.mockResolvedValue([
      addOnRow({ capacity: 2, _count: { bookings: 2 } }),
    ]);

    await expect(
      resolvePurchaseAddOns(undefined, 'participant-1'),
    ).rejects.toMatchObject({ errorCode: ErrorCode.ADD_ON_SOLD_OUT });
  });

  it('rejects an id that is not in the catalog', async () => {
    mockDb.addOn.findMany.mockResolvedValue([]);

    await expect(resolvePurchaseAddOns(['missing'])).rejects.toMatchObject({
      errorCode: ErrorCode.ADD_ON_NOT_FOUND,
    });
  });
});

describe('mapAddOn', () => {
  it('reports bookings held and spots remaining', () => {
    const mapped = mapAddOn(addOnRow({ capacity: 10, _count: { bookings: 3 } }));
    expect(mapped).toMatchObject({ booked: 3, remaining: 7 });
    expect(mapped.createdAt).toBe('2026-09-25T00:00:00.000Z');
  });

  it('reports unlimited capacity as null remaining', () => {
    expect(mapAddOn(addOnRow()).remaining).toBeNull();
  });
});

describe('describeAddOn', () => {
  it('labels a room with its provider and occupancy', () => {
    expect(
      describeAddOn({ name: 'Double room', provider: 'KOD Apartment', occupancy: 2 }),
    ).toBe('KOD Apartment — Double room (2 sharing)');
  });

  it('labels transport by name alone', () => {
    expect(
      describeAddOn({ name: 'Return group transport', provider: null, occupancy: null }),
    ).toBe('Return group transport');
  });
});
