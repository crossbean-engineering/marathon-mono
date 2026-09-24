import { MojoOmniVerificationIntegration } from '../MojoOmniVerificationIntegration';
import { MojoOmniConfig } from '../types';

const config: MojoOmniConfig = {
  clientId: 'c',
  clientSecret: 's',
  accountRef: 'accra-branch',
};
const tokenBody = { access_token: 'tok', token_type: 'Bearer', expires_in: 1200 };

function jsonResponse(status: number, body: unknown, statusText = 'OK') {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => body,
  } as unknown as Response;
}

describe('MojoOmniVerificationIntegration', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function newIntegration() {
    return new MojoOmniVerificationIntegration({ environment: 'dev' });
  }

  it('verifies an MSISDN and camelCases the profile', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          status: 'verified',
          profile: { first_name: 'Ama', last_name: 'Mensah' },
        }),
      );

    const result = await newIntegration().verifyMsisdn(
      { mobile: '233200000000', provider: 'MTN' },
      config,
    );

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://omni.mojo-pay.com/v1/verifications/msisdn');
    expect(JSON.parse(init.body)).toEqual({
      mobile: '233200000000',
      provider: 'MTN',
    });
    expect(result.status).toBe('verified');
    expect(result.profile).toEqual({ firstName: 'Ama', lastName: 'Mensah' });
  });

  it('returns a null profile when the check is invalid', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { status: 'invalid', profile: null }));

    const result = await newIntegration().verifyMsisdn(
      { mobile: '233200000000' },
      config,
    );

    expect(result.status).toBe('invalid');
    expect(result.profile).toBeNull();
  });

  it('verifies a bank account with snake_case fields', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { status: 'verified' }));

    await newIntegration().verifyBankAccount(
      { bankCode: 'GCB', accountNumber: '1234567890' },
      config,
    );

    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      bank_code: 'GCB',
      account_number: '1234567890',
    });
  });

  it('omits the account header on metadata routes', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { banks: [] }));

    await newIntegration().getBanks(config);

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://omni.mojo-pay.com/v1/metadata/banks');
    expect(init.headers['X-Mojo-Account-Ref']).toBeUndefined();
  });

  it('returns mobile providers raw', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { providers: [{ code: 'MTN' }] }));

    const result = await newIntegration().getMobileProviders(config);

    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://omni.mojo-pay.com/v1/metadata/mobile_providers',
    );
    expect(result).toEqual({ providers: [{ code: 'MTN' }] });
  });

  it('reads the resolved account context', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          object: 'account_context',
          merchant: { id: 7, name: 'Softin', sub_accounts_enabled: true },
          account: {
            id: 'MAC_ABCDEF123456',
            object: 'merchant_account',
            account_ref: 'accra-branch',
            name: 'Accra',
            status: 'active',
          },
        }),
      );

    const result = await newIntegration().getAccountContext(config);

    expect(fetchMock.mock.calls[1][0]).toBe('https://omni.mojo-pay.com/v1/account');
    expect(result.merchant).toEqual({
      id: 7,
      name: 'Softin',
      subAccountsEnabled: true,
    });
    expect(result.account).toEqual({
      id: 'MAC_ABCDEF123456',
      accountRef: 'accra-branch',
      name: 'Accra',
      status: 'active',
    });
  });

  it('returns a null account when sub-accounts are not in play', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          merchant: { id: 7, name: 'Softin', sub_accounts_enabled: false },
          account: null,
        }),
      );

    expect((await newIntegration().getAccountContext(config)).account).toBeNull();
  });
});
