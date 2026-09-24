import {
  MojoOmniCollectionIntegration,
  toOmniCollection,
} from '../MojoOmniCollectionIntegration';
import { MojoOmniConfig } from '../types';

const config: MojoOmniConfig = { clientId: 'c', clientSecret: 's' };

function jsonResponse(status: number, body: unknown, statusText = 'OK') {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => body,
  } as unknown as Response;
}

const tokenBody = { access_token: 'tok', token_type: 'Bearer', expires_in: 1200 };

describe('toOmniCollection', () => {
  it('normalises money to pesewas and maps the status', () => {
    const result = toOmniCollection({
      id: 'COL_1',
      status: 'succeeded',
      currency: 'GHS',
      merchant_reference: 'REF-1',
      amount: '1.00',
      fee_amount: '0.02',
      fee_mode: 'on_top',
      amount_payable: '1.02',
      merchant_settlement_amount: '1.00',
      some_undocumented_field: 'kept',
    });

    expect(result.amount).toBe(100);
    expect(result.feeAmount).toBe(2);
    expect(result.amountPayable).toBe(102);
    expect(result.merchantSettlementAmount).toBe(100);
    expect(result.feeMode).toBe('on_top');
    expect(result.status).toBe('succeeded');
    expect(result.paymentStatus).toBe('completed');
    expect(result.merchantReference).toBe('REF-1');
    expect(result.raw['some_undocumented_field']).toBe('kept');
  });

  it('maps processing to pending', () => {
    expect(toOmniCollection({ status: 'processing' }).paymentStatus).toBe('pending');
  });

  it('leaves an unrecognised status off the typed union but keeps it in raw', () => {
    const result = toOmniCollection({ status: 'reversed' });

    expect(result.status).toBeUndefined();
    expect(result.paymentStatus).toBe('pending');
    expect(result.raw['status']).toBe('reversed');
  });
});

describe('MojoOmniCollectionIntegration', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('posts a collection with the amount as a decimal string', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(201, { id: 'COL_1', status: 'processing', amount: '1.00' }),
      );

    const integration = new MojoOmniCollectionIntegration({ environment: 'dev' });
    const result = await integration.createCollection(
      {
        amount: 100,
        currency: 'GHS',
        merchantReference: 'REF-1',
        mobile: '233200000000',
        provider: 'MTN',
        description: 'Donation',
      },
      config,
      'idem-key-1',
    );

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://omni.mojo-pay.com/v1/collections');
    expect(init.method).toBe('POST');
    expect(init.headers['Idempotency-Key']).toBe('idem-key-1');
    expect(JSON.parse(init.body)).toEqual({
      amount: '1.00',
      currency: 'GHS',
      merchant_reference: 'REF-1',
      mobile: '233200000000',
      provider: 'MTN',
      description: 'Donation',
    });
    expect(result.id).toBe('COL_1');
    expect(result.paymentStatus).toBe('pending');
  });

  it('rejects an empty idempotency key before making a request', async () => {
    const integration = new MojoOmniCollectionIntegration({ environment: 'dev' });

    await expect(
      integration.createCollection(
        {
          amount: 100,
          currency: 'GHS',
          merchantReference: 'R',
          mobile: '1',
          provider: 'MTN',
        },
        config,
        '  ',
      ),
    ).rejects.toThrow(/idempotencyKey/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('gets a collection by id', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { id: 'COL_1', status: 'succeeded' }));

    const integration = new MojoOmniCollectionIntegration({ environment: 'dev' });
    const result = await integration.getCollectionById('COL_1', config);

    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://omni.mojo-pay.com/v1/collections/COL_1',
    );
    expect(result.paymentStatus).toBe('completed');
  });

  it('gets a collection by merchant reference via the query parameter', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { id: 'COL_1', status: 'failed' }));

    const integration = new MojoOmniCollectionIntegration({ environment: 'dev' });
    const result = await integration.getCollectionByReference('REF 1', config);

    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://omni.mojo-pay.com/v1/collections?merchant_reference=REF+1',
    );
    expect(result.paymentStatus).toBe('failed');
  });

  it('returns the unified verify snapshot untouched', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { object: 'payout', anything: 1 }));

    const integration = new MojoOmniCollectionIntegration({ environment: 'dev' });
    const result = await integration.verifyTransaction('REF-1', config);

    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://omni.mojo-pay.com/v1/transactions/verify/REF-1',
    );
    expect(result).toEqual({ object: 'payout', anything: 1 });
  });
});
