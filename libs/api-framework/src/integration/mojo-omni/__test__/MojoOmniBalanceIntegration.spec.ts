import { MojoOmniBalanceIntegration } from '../MojoOmniBalanceIntegration';
import { MojoOmniConfig } from '../types';

const config: MojoOmniConfig = { clientId: 'c', clientSecret: 's', accountRef: 'main' };
const tokenBody = { access_token: 'tok', token_type: 'Bearer', expires_in: 1200 };

function jsonResponse(status: number, body: unknown, statusText = 'OK') {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => body,
  } as unknown as Response;
}

describe('MojoOmniBalanceIntegration', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('normalises every wallet field to pesewas', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          currency: 'GHS',
          available: '150.00',
          collection_wallet: '100.00',
          collection_wallet_actual: '120.00',
          collection_wallet_held: '20.00',
          payout_wallet: '50.00',
          pending: '5.00',
          provider_float: '9.99',
        }),
      );

    const integration = new MojoOmniBalanceIntegration({ environment: 'dev' });
    const result = await integration.getBalance(undefined, config);

    expect(result).toEqual({
      currency: 'GHS',
      available: 15000,
      collectionWallet: 10000,
      collectionWalletActual: 12000,
      collectionWalletHeld: 2000,
      payoutWallet: 5000,
      pending: 500,
      providerFloat: 999,
      raw: expect.any(Object),
    });
  });

  it('omits X-Mojo-Account-Ref even though the config carries one', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { currency: 'GHS', available: '0.00' }));

    await new MojoOmniBalanceIntegration({ environment: 'dev' }).getBalance(undefined, config);

    expect(fetchMock.mock.calls[1][1].headers['X-Mojo-Account-Ref']).toBeUndefined();
  });

  it('leaves absent wallet fields undefined rather than 0', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { currency: 'GHS', available: '0.00' }));

    const integration = new MojoOmniBalanceIntegration({ environment: 'dev' });
    const result = await integration.getBalance(undefined, config);

    expect(result.available).toBe(0);
    expect(result.payoutWallet).toBeUndefined();
    expect(result.providerFloat).toBeUndefined();
    expect(result.pending).toBeUndefined();
  });

  it('passes an explicit currency as a query parameter, dropping it when omitted', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { currency: 'NGN', available: '0.00' }));

    await new MojoOmniBalanceIntegration({ environment: 'dev' }).getBalance(
      { currency: 'NGN' },
      config,
    );

    expect(fetchMock.mock.calls[1][0]).toBe('https://omni.mojo-pay.com/v1/balance?currency=NGN');
  });

  it('throws when a present money field is not a decimal string', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { currency: 'GHS', available: 150 }));

    await expect(
      new MojoOmniBalanceIntegration({ environment: 'dev' }).getBalance(undefined, config),
    ).rejects.toThrow(/available/);
  });
});
