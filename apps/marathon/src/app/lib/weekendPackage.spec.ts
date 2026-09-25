import type { BaseAddOn } from '@ak-marathon/sdk';
import {
  addOnTotal,
  availableBundles,
  describeAddOn,
  RACE_ONLY,
  selectedAddOns,
  selectionError,
} from './weekendPackage';

const addOn = (overrides: Partial<BaseAddOn>): BaseAddOn => ({
  id: 'id',
  type: 'accommodation',
  name: 'Room',
  provider: null,
  description: null,
  occupancy: null,
  price: 0,
  capacity: null,
  booked: 0,
  remaining: null,
  isActive: true,
  createdAt: '2026-09-25T00:00:00.000Z',
  ...overrides,
});

// The options priced in the event brief.
const kodTriple = addOn({ id: 'kod-3', provider: 'KOD Apartment', name: 'Triple room', occupancy: 3, price: 15000 });
const kodDouble = addOn({ id: 'kod-2', provider: 'KOD Apartment', name: 'Double room', occupancy: 2, price: 22500 });
const kodSingle = addOn({ id: 'kod-1', provider: 'KOD Apartment', name: 'Single room', occupancy: 1, price: 45000 });
const bus = addOn({ id: 'bus', type: 'transport', name: 'Return group transportation', price: 25000 });
const catalog = [kodTriple, kodDouble, kodSingle, bus];

describe('availableBundles', () => {
  it('offers all four bundles when rooms and transport exist', () => {
    expect(availableBundles(catalog).map((b) => b.id)).toEqual([
      'race',
      'race_transport',
      'race_stay',
      'full',
    ]);
  });

  it('offers only race-only when there are no add-ons', () => {
    expect(availableBundles([]).map((b) => b.id)).toEqual(['race']);
  });

  it('drops the stay bundles when every room is fully booked', () => {
    const soldOut = [kodDouble, kodSingle].map((a) => ({ ...a, capacity: 2, booked: 2, remaining: 0 }));
    expect(availableBundles([...soldOut, bus]).map((b) => b.id)).toEqual(['race', 'race_transport']);
  });

  it('drops bundles whose add-ons are all hidden', () => {
    expect(availableBundles([{ ...bus, isActive: false }]).map((b) => b.id)).toEqual(['race']);
  });
});

describe('selectedAddOns', () => {
  it('books nothing for race only', () => {
    expect(selectedAddOns(RACE_ONLY, catalog)).toEqual([]);
  });

  it('auto-picks the only transport option for Race + Transport', () => {
    expect(selectedAddOns({ ...RACE_ONLY, bundle: 'race_transport' }, catalog)).toEqual([bus]);
  });

  it('books the chosen room plus transport for the Full Package', () => {
    const selection = { bundle: 'full' as const, accommodationId: 'kod-2', transportId: '' };
    const booked = selectedAddOns(selection, catalog);
    expect(booked).toEqual([bus, kodDouble]);
    expect(addOnTotal(booked)).toBe(47500);
  });

  it('ignores a room chosen earlier when the bundle no longer needs one', () => {
    const selection = { bundle: 'race_transport' as const, accommodationId: 'kod-2', transportId: '' };
    expect(selectedAddOns(selection, catalog)).toEqual([bus]);
  });

  it('treats a bundle that stopped being offered as race only', () => {
    const selection = { bundle: 'race_transport' as const, accommodationId: '', transportId: '' };
    expect(selectedAddOns(selection, [kodDouble])).toEqual([]);
    expect(selectionError(selection, [kodDouble])).toBeNull();
  });
});

describe('selectionError', () => {
  it('asks for a room when a stay bundle has several to choose from', () => {
    expect(selectionError({ ...RACE_ONLY, bundle: 'race_stay' }, catalog)).toBe(
      "Choose where you'd like to stay",
    );
  });

  it('is satisfied once a room is chosen', () => {
    expect(selectionError({ ...RACE_ONLY, bundle: 'race_stay', accommodationId: 'kod-1' }, catalog)).toBeNull();
  });

  it('rejects a room that has since sold out', () => {
    const soldOutSingle = { ...kodSingle, capacity: 1, booked: 1, remaining: 0 };
    const selection = { ...RACE_ONLY, bundle: 'race_stay' as const, accommodationId: 'kod-1' };
    expect(selectionError(selection, [kodDouble, soldOutSingle])).toBe("Choose where you'd like to stay");
  });
});

describe('describeAddOn', () => {
  it('labels rooms with the property and occupancy', () => {
    expect(describeAddOn(kodTriple)).toBe('KOD Apartment — Triple room (3 sharing)');
  });

  it('labels transport by name', () => {
    expect(describeAddOn(bus)).toBe('Return group transportation');
  });
});
