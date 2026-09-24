import { toOmniAmount, fromOmniAmount, normalizeAmountFields } from '../amounts';

describe('toOmniAmount', () => {
  it.each([
    [0, '0.00'],
    [1, '0.01'],
    [99, '0.99'],
    [100, '1.00'],
    [102, '1.02'],
    [123456789, '1234567.89'],
  ])('converts %i pesewas to "%s"', (pesewas, expected) => {
    expect(toOmniAmount(pesewas)).toBe(expected);
  });

  it('rejects a non-integer rather than truncating a fraction of a pesewa', () => {
    expect(() => toOmniAmount(1.5)).toThrow(/integer/i);
  });

  it('rejects a negative amount', () => {
    expect(() => toOmniAmount(-100)).toThrow(/non-negative/i);
  });
});

describe('fromOmniAmount', () => {
  it('parses without floating point error', () => {
    // parseFloat('1.02') * 100 === 101.99999999999999 — this is the trap this module exists for.
    expect(fromOmniAmount('1.02')).toBe(102);
  });

  it.each([
    ['0.00', 0],
    ['1', 100],
    ['1.2', 120],
    ['1.00', 100],
    ['1234567.89', 123456789],
  ])('parses "%s" to %i pesewas', (value, expected) => {
    expect(fromOmniAmount(value)).toBe(expected);
  });

  it.each(['abc', '', '  ', '1.23456', '-1.00'])('rejects %p', (value) => {
    expect(() => fromOmniAmount(value)).toThrow();
  });

  // The doc: amounts carry up to 4 dp internally, "displayed/settled at 2 dp
  // (ceil)". A value with 3-4 fractional digits must round UP to the next
  // pesewa when it doesn't land exactly on a 2dp boundary, not throw and lose
  // the whole response.
  it.each([
    ['1.0050', 101], // 3rd/4th dp present, rounds up past 1.00
    ['1.005', 101], // same value, 3dp
    ['1.001', 101], // any sub-pesewa remainder rounds up
    ['1.0000', 100], // exact at 4dp — no rounding needed
    ['0.0001', 1], // smallest possible remainder still rounds up to 1 pesewa
    ['1.0100', 101], // exact 2dp value padded to 4dp — no rounding needed
  ])('parses "%s" as 4dp-with-ceiling to %i pesewas', (value, expected) => {
    expect(fromOmniAmount(value)).toBe(expected);
  });

  it('round-trips every value', () => {
    for (const pesewas of [0, 1, 7, 99, 100, 101, 999, 100000, 123456789]) {
      expect(fromOmniAmount(toOmniAmount(pesewas))).toBe(pesewas);
    }
  });
});

describe('normalizeAmountFields', () => {
  it('converts every documented money field to pesewas', () => {
    expect(
      normalizeAmountFields({
        amount: '1.00',
        fee_amount: '0.02',
        fee_mode: 'on_top',
        amount_payable: '1.02',
        merchant_settlement_amount: '1.00',
      }),
    ).toEqual({
      amount: 100,
      feeAmount: 2,
      amountPayable: 102,
      merchantSettlementAmount: 100,
      feeMode: 'on_top',
    });
  });

  it('leaves absent fields undefined', () => {
    expect(normalizeAmountFields({ amount: '5.00' })).toEqual({
      amount: 500,
      feeAmount: undefined,
      amountPayable: undefined,
      merchantSettlementAmount: undefined,
      feeMode: undefined,
    });
  });

  it('ignores an unrecognised fee_mode', () => {
    expect(normalizeAmountFields({ fee_mode: 'weird' }).feeMode).toBeUndefined();
  });

  it('throws on a money field that is present but not a decimal string', () => {
    // Silently dropping it would hand a caller `undefined` for a payment the
    // API reported as succeeded, and we cannot guess pesewas from GHS.
    expect(() => normalizeAmountFields({ amount: 1020 })).toThrow(
      /"amount".*decimal string.*number/i,
    );
    expect(() => normalizeAmountFields({ fee_amount: { value: 2 } })).toThrow(
      /"fee_amount"/,
    );
  });

  it('treats null and an empty string as absent rather than throwing', () => {
    expect(normalizeAmountFields({ amount: null }).amount).toBeUndefined();
    expect(normalizeAmountFields({ amount: '' }).amount).toBeUndefined();
  });

  it('does not throw or lose the response on a 4dp fee_amount', () => {
    expect(normalizeAmountFields({ fee_amount: '0.0050' }).feeAmount).toBe(1);
  });
});
