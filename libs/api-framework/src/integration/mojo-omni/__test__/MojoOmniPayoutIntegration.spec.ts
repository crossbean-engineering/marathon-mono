import { MojoOmniPayoutIntegration } from '../MojoOmniPayoutIntegration';
import { MojoOmniConfig } from '../types';

const config: MojoOmniConfig = { clientId: 'c', clientSecret: 's' };
const tokenBody = { access_token: 'tok', token_type: 'Bearer', expires_in: 1200 };

function jsonResponse(status: number, body: unknown, statusText = 'OK') {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => body,
  } as unknown as Response;
}

describe('MojoOmniPayoutIntegration', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('posts a mobile_money payout with the amount as a decimal string', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(201, { id: 'PO_1', status: 'processing', amount: '10.00' }),
      );

    const integration = new MojoOmniPayoutIntegration({ environment: 'dev' });
    const result = await integration.createPayout(
      {
        type: 'mobile_money',
        amount: 1000,
        currency: 'GHS',
        merchantReference: 'PR-1',
        mobile: '233200000000',
        provider: 'MTN',
      },
      config,
      'idem-po-1',
    );

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://omni.mojo-pay.com/v1/payouts');
    expect(init.method).toBe('POST');
    expect(init.headers['Idempotency-Key']).toBe('idem-po-1');
    expect(JSON.parse(init.body)).toEqual({
      type: 'mobile_money',
      amount: '10.00',
      currency: 'GHS',
      merchant_reference: 'PR-1',
      mobile: '233200000000',
      provider: 'MTN',
    });
    expect(result.id).toBe('PO_1');
    expect(result.paymentStatus).toBe('pending');
    expect(result.amount).toBe(1000);
  });

  it('includes narration only when given', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(201, { id: 'PO_1b', status: 'processing' }));

    await new MojoOmniPayoutIntegration({ environment: 'dev' }).createPayout(
      {
        type: 'mobile_money',
        amount: 1000,
        currency: 'GHS',
        merchantReference: 'PR-1b',
        mobile: '233200000000',
        provider: 'MTN',
        narration: 'Vendor settlement',
      },
      config,
      'idem-po-1b',
    );

    expect(JSON.parse(fetchMock.mock.calls[1][1].body).narration).toBe('Vendor settlement');
  });

  it('posts a bank payout with bank_code and account_number, and normalises amount_debited', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(201, {
          id: 'PO_2',
          status: 'succeeded',
          amount: '25.00',
          amount_debited: '25.50',
        }),
      );

    const integration = new MojoOmniPayoutIntegration({ environment: 'dev' });
    const result = await integration.createPayout(
      {
        type: 'bank',
        amount: 2500,
        currency: 'GHS',
        merchantReference: 'PR-2',
        accountNumber: '0011223344',
        bankCode: 'GH_ACC',
      },
      config,
      'idem-po-2',
    );

    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      type: 'bank',
      amount: '25.00',
      currency: 'GHS',
      merchant_reference: 'PR-2',
      account_number: '0011223344',
      bank_code: 'GH_ACC',
    });
    expect(result.paymentStatus).toBe('completed');
    expect(result.amount).toBe(2500);
    // 25.50 * 100 must be exactly 2550, not 2549.9999999999995 (the parseFloat
    // trap amounts.ts exists to avoid) — this is why toOmniPayout must use
    // parseMoneyField/fromOmniAmount for amount_debited, never parseFloat.
    expect(result.amountDebited).toBe(2550);
  });

  it('rejects an empty idempotency key before making a request', async () => {
    const integration = new MojoOmniPayoutIntegration({ environment: 'dev' });

    await expect(
      integration.createPayout(
        {
          type: 'mobile_money',
          amount: 100,
          currency: 'GHS',
          merchantReference: 'R',
          mobile: '1',
          provider: 'MTN',
        },
        config,
        '   ',
      ),
    ).rejects.toThrow(/idempotencyKey/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('gets a payout by merchant reference', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(200, { id: 'PO_1', status: 'failed', merchant_reference: 'PR-1' }),
      );

    const integration = new MojoOmniPayoutIntegration({ environment: 'dev' });
    const result = await integration.getPayoutByReference('PR-1', config);

    expect(fetchMock.mock.calls[1][0]).toBe('https://omni.mojo-pay.com/v1/payouts/PR-1');
    expect(result.paymentStatus).toBe('failed');
    expect(result.merchantReference).toBe('PR-1');
  });
});
