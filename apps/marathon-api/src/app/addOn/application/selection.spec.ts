import { ErrorCode } from '@marathon/core';
import {
  AddOnCandidate,
  remainingCapacity,
  selectAddOns,
  sumAddOnLines,
  toAddOnLines,
} from './selection';

const room = (overrides: Partial<AddOnCandidate> = {}): AddOnCandidate => ({
  id: 'kod-double',
  type: 'accommodation',
  name: 'KOD Apartment — 2 sharing',
  price: 22500,
  isActive: true,
  capacity: null,
  booked: 0,
  ...overrides,
});

const bus = (overrides: Partial<AddOnCandidate> = {}): AddOnCandidate => ({
  id: 'return-bus',
  type: 'transport',
  name: 'Return group transport',
  price: 25000,
  isActive: true,
  capacity: null,
  booked: 0,
  ...overrides,
});

// selectAddOns throws rab-api exceptions carrying an ErrorCode; assert on it.
function errorCodeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    return (e as { errorCode?: string }).errorCode;
  }
  throw new Error('expected selectAddOns to throw');
}

describe('selectAddOns', () => {
  it('returns nothing when nothing is requested', () => {
    expect(selectAddOns([], [room(), bus()])).toEqual([]);
  });

  it('selects one accommodation and one transport (Full Package)', () => {
    const selected = selectAddOns(['kod-double', 'return-bus'], [room(), bus()]);
    expect(selected.map((a) => a.id)).toEqual(['kod-double', 'return-bus']);
  });

  it('collapses a duplicated id into a single booking', () => {
    const selected = selectAddOns(['return-bus', 'return-bus'], [bus()]);
    expect(selected).toHaveLength(1);
  });

  it('rejects an unknown add-on', () => {
    expect(errorCodeOf(() => selectAddOns(['nope'], [room()]))).toBe(
      ErrorCode.ADD_ON_NOT_FOUND,
    );
  });

  it('rejects an inactive add-on', () => {
    expect(
      errorCodeOf(() => selectAddOns(['kod-double'], [room({ isActive: false })])),
    ).toBe(ErrorCode.ADD_ON_INACTIVE);
  });

  it('allows an inactive add-on the participant already booked', () => {
    const selected = selectAddOns(
      ['kod-double'],
      [room({ isActive: false })],
      { allowInactive: new Set(['kod-double']) },
    );
    expect(selected).toHaveLength(1);
  });

  it('rejects two add-ons of the same type', () => {
    const single = room({ id: 'kod-single', price: 45000 });
    expect(
      errorCodeOf(() => selectAddOns(['kod-double', 'kod-single'], [room(), single])),
    ).toBe(ErrorCode.ADD_ON_CONFLICT);
  });

  it('rejects a fully booked add-on', () => {
    expect(
      errorCodeOf(() =>
        selectAddOns(['kod-double'], [room({ capacity: 4, booked: 4 })]),
      ),
    ).toBe(ErrorCode.ADD_ON_SOLD_OUT);
  });

  it('accepts the last remaining spot', () => {
    const selected = selectAddOns(['kod-double'], [room({ capacity: 4, booked: 3 })]);
    expect(selected).toHaveLength(1);
  });

  it('does not re-check capacity for a spot the participant already holds', () => {
    const selected = selectAddOns(
      ['kod-double'],
      [room({ capacity: 4, booked: 4 })],
      { skipCapacity: new Set(['kod-double']) },
    );
    expect(selected).toHaveLength(1);
  });
});

describe('add-on pricing', () => {
  it('prices each line at the add-on price and totals them', () => {
    const lines = toAddOnLines([room(), bus()]);
    expect(lines).toEqual([
      { addOnId: 'kod-double', price: 22500 },
      { addOnId: 'return-bus', price: 25000 },
    ]);
    expect(sumAddOnLines(lines)).toBe(47500);
  });

  it('totals an empty selection to zero', () => {
    expect(sumAddOnLines([])).toBe(0);
  });
});

describe('remainingCapacity', () => {
  it('is null when capacity is unlimited', () => {
    expect(remainingCapacity(null, 12)).toBeNull();
  });

  it('never goes below zero', () => {
    expect(remainingCapacity(10, 3)).toBe(7);
    expect(remainingCapacity(10, 12)).toBe(0);
  });
});
