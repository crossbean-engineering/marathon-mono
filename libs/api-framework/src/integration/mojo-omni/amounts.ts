/**
 * MojoPay Omni sends and receives money as decimal strings ("1.02").
 * Every app in this repo stores money as integer pesewas (100 = 1 GHS).
 * Conversion lives here and nowhere else.
 */

const PESEWAS_PER_UNIT = 100;

export type OmniFeeMode = 'on_top' | 'absorb';

export type OmniAmounts = {
  amount?: number;
  feeAmount?: number;
  feeMode?: OmniFeeMode;
  amountPayable?: number;
  merchantSettlementAmount?: number;
};

export function toOmniAmount(pesewas: number): string {
  if (!Number.isInteger(pesewas)) {
    throw new Error(
      `toOmniAmount expects an integer pesewa amount, received ${pesewas}`,
    );
  }
  if (pesewas < 0) {
    throw new Error(
      `toOmniAmount expects a non-negative amount, received ${pesewas}`,
    );
  }
  const units = Math.floor(pesewas / PESEWAS_PER_UNIT);
  const remainder = pesewas % PESEWAS_PER_UNIT;
  return `${units}.${String(remainder).padStart(2, '0')}`;
}

/**
 * Omni carries amounts at up to 4 decimal places internally but documents
 * settlement/display at 2 dp with ceiling rounding — so "1.0050" is a valid
 * response value that must become 101 pesewas (1.01), not be rejected or
 * truncated to 100. Rounding is done in integer ten-thousandths, never via
 * float division, so the ceiling can't drift off by a pesewa the way
 * `parseFloat('1.02') * 100` (== 101.99999999999999) would.
 */
export function fromOmniAmount(value: string): number {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!/^\d+(\.\d{1,4})?$/.test(trimmed)) {
    throw new Error(
      `fromOmniAmount cannot parse ${JSON.stringify(value)} as a decimal amount`,
    );
  }
  const [units, fraction = ''] = trimmed.split('.');
  const tenThousandths = Number(units) * 10000 + Number(fraction.padEnd(4, '0'));
  const wholePesewas = Math.floor(tenThousandths / 100);
  const subPesewaRemainder = tenThousandths % 100;
  return subPesewaRemainder === 0 ? wholePesewas : wholePesewas + 1;
}

/**
 * Converts the four documented money fields on an Omni response body to pesewas.
 * Absent fields stay undefined rather than becoming 0 — "no fee quoted" and
 * "zero fee" are different facts.
 */
export function normalizeAmountFields(
  raw: Record<string, unknown>,
): OmniAmounts {
  const feeMode = raw['fee_mode'];

  return {
    amount: parseMoneyField(raw['amount'], 'amount'),
    feeAmount: parseMoneyField(raw['fee_amount'], 'fee_amount'),
    amountPayable: parseMoneyField(raw['amount_payable'], 'amount_payable'),
    merchantSettlementAmount: parseMoneyField(
      raw['merchant_settlement_amount'],
      'merchant_settlement_amount',
    ),
    feeMode: feeMode === 'on_top' || feeMode === 'absorb' ? feeMode : undefined,
  };
}

/**
 * Reads one money field off a response body.
 *
 * A field that is absent stays undefined. A field that is PRESENT but not a
 * parseable decimal string throws, rather than silently vanishing: a caller
 * that credits `event.data.amount` must not be handed `undefined` for a
 * payment the API reports as succeeded. Loud beats silent where money is
 * concerned, and we cannot guess whether a bare number means pesewas or GHS.
 */
export function parseMoneyField(
  value: unknown,
  fieldName: string,
): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  if (typeof value !== 'string') {
    throw new Error(
      `Expected MojoPay Omni field "${fieldName}" to be a decimal string, received ${typeof value}: ${JSON.stringify(value)}`,
    );
  }
  return fromOmniAmount(value);
}
