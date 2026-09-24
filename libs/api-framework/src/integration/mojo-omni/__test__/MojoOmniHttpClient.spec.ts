import { MojoOmniHttpClient, requireIdempotencyKey } from '../MojoOmniHttpClient';
import { MojoOmniApiError, MojoOmniNotFoundError } from '../errors';
import { MojoOmniConfig } from '../types';

const config: MojoOmniConfig = {
  clientId: 'client_abc',
  clientSecret: 'secret_xyz',
};

const tokenBody = {
  access_token: 'tok_one',
  token_type: 'Bearer',
  expires_in: 1200,
};

function jsonResponse(status: number, body: unknown, statusText = 'OK') {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => body,
  } as unknown as Response;
}

describe('requireIdempotencyKey', () => {
  it('returns the key when it is a non-empty string', () => {
    expect(requireIdempotencyKey('key-1')).toBe('key-1');
  });

  it.each(['', '   '])('rejects %p', (key) => {
    expect(() => requireIdempotencyKey(key)).toThrow(/idempotencyKey/i);
  });

  it('rejects a non-string', () => {
    expect(() => requireIdempotencyKey(undefined as unknown as string)).toThrow(
      /idempotencyKey/i,
    );
  });
});

describe('MojoOmniHttpClient', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function newClient() {
    return new MojoOmniHttpClient({ environment: 'dev' });
  }

  it('authenticates then sends the request with a bearer token', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { id: 'COL_1' }));

    const client = newClient();
    const result = await client.request<{ id: string }>(
      'GET',
      '/v1/collections/COL_1',
      { config },
    );

    expect(result).toEqual({ id: 'COL_1' });

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe('https://omni.mojo-pay.com/v1/oauth/token');
    expect(JSON.parse(tokenInit.body)).toEqual({
      grant_type: 'client_credentials',
      client_id: 'client_abc',
      client_secret: 'secret_xyz',
    });

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://omni.mojo-pay.com/v1/collections/COL_1');
    expect(init.headers.Authorization).toBe('Bearer tok_one');
    expect(init.headers.Accept).toBe('application/json');
  });

  it('reuses a cached token across requests', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValue(jsonResponse(200, {}));

    const client = newClient();
    await client.request('GET', '/v1/balance', { config });
    await client.request('GET', '/v1/balance', { config });

    const tokenCalls = fetchMock.mock.calls.filter(
      ([url]) => typeof url === 'string' && url.endsWith('/v1/oauth/token'),
    );
    expect(tokenCalls).toHaveLength(1);
  });

  it('does not reuse a cached token after the secret is rotated', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, tokenBody));

    const client = newClient();
    await client.request('GET', '/v1/balance', { config });
    await client.request('GET', '/v1/balance', {
      config: { clientId: 'client_abc', clientSecret: 'ROTATED' },
    });

    const tokenCalls = fetchMock.mock.calls.filter(
      ([url]) => typeof url === 'string' && url.endsWith('/v1/oauth/token'),
    );
    expect(tokenCalls).toHaveLength(2);
  });

  it('does not cache a token whose expires_in is missing or unusable', async () => {
    // A NaN expiry would make `now < NaN - skew` permanently false: the entry
    // would never be hit and never evicted.
    fetchMock.mockResolvedValue(jsonResponse(200, { access_token: 'tok_no_exp' }));

    const client = newClient();
    await client.request('GET', '/v1/balance', { config });
    await client.request('GET', '/v1/balance', { config });

    const tokenCalls = fetchMock.mock.calls.filter(
      ([url]) => typeof url === 'string' && url.endsWith('/v1/oauth/token'),
    );
    expect(tokenCalls).toHaveLength(2);
  });

  it('hands mappers an empty object when a 2xx carries no body', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        json: async () => {
          throw new SyntaxError('Unexpected end of JSON input');
        },
      } as unknown as Response);

    await expect(
      newClient().request('POST', '/v1/mandates/MND_1/cancel', {
        config,
        idempotencyKey: 'k',
        body: {},
      }),
    ).resolves.toEqual({});
  });

  it('keeps separate tokens per client id', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, tokenBody));

    const client = newClient();
    await client.request('GET', '/v1/balance', { config });
    await client.request('GET', '/v1/balance', {
      config: { clientId: 'other', clientSecret: 'other_secret' },
    });

    const tokenCalls = fetchMock.mock.calls.filter(
      ([url]) => typeof url === 'string' && url.endsWith('/v1/oauth/token'),
    );
    expect(tokenCalls).toHaveLength(2);
  });

  it('re-authenticates once and replays the request on a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(
          401,
          { error: { code: 'invalid_token', message: 'expired', request_id: 'REQ_1' } },
          'Unauthorized',
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: 'tok_two',
          token_type: 'Bearer',
          expires_in: 1200,
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { id: 'COL_2' }));

    const client = newClient();
    const result = await client.request<{ id: string }>(
      'GET',
      '/v1/collections/COL_2',
      { config },
    );

    expect(result).toEqual({ id: 'COL_2' });
    expect(fetchMock.mock.calls[3][1].headers.Authorization).toBe('Bearer tok_two');
  });

  it('gives up after a single retry when the 401 persists', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(401, {}, 'Unauthorized'))
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(401, {}, 'Unauthorized'));

    await expect(
      newClient().request('GET', '/v1/balance', { config }),
    ).rejects.toBeInstanceOf(MojoOmniApiError);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('sends the Idempotency-Key when given', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(201, {}));

    await newClient().request('POST', '/v1/collections', {
      config,
      body: { amount: '1.00' },
      idempotencyKey: 'key-123',
    });

    const [, init] = fetchMock.mock.calls[1];
    expect(init.headers['Idempotency-Key']).toBe('key-123');
    expect(JSON.parse(init.body)).toEqual({ amount: '1.00' });
  });

  it('sends X-Mojo-Account-Ref when accountRef is set', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, {}));

    await newClient().request('GET', '/v1/collections/COL_3', {
      config: { ...config, accountRef: 'accra-branch' },
    });

    expect(fetchMock.mock.calls[1][1].headers['X-Mojo-Account-Ref']).toBe(
      'accra-branch',
    );
  });

  it('omits X-Mojo-Account-Ref on the exempt routes', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, {}));

    await newClient().request('GET', '/v1/metadata/banks', {
      config: { ...config, accountRef: 'accra-branch' },
      omitAccountRef: true,
    });

    expect(
      fetchMock.mock.calls[1][1].headers['X-Mojo-Account-Ref'],
    ).toBeUndefined();
  });

  it('appends defined query parameters and drops undefined ones', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, {}));

    await newClient().request('GET', '/v1/collections', {
      config,
      query: { merchant_reference: 'REF-1', currency: undefined },
    });

    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://omni.mojo-pay.com/v1/collections?merchant_reference=REF-1',
    );
  });

  it('throws a MojoOmniNotFoundError on 404', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(
          404,
          { error: { code: 'not_found', message: 'gone', request_id: 'REQ_2' } },
          'Not Found',
        ),
      );

    await expect(
      newClient().request('GET', '/v1/collections/nope', { config }),
    ).rejects.toBeInstanceOf(MojoOmniNotFoundError);
  });

  it('uses the same host for the prod environment — Omni has no separate sandbox', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, {}));

    await new MojoOmniHttpClient({ environment: 'prod' }).request(
      'GET',
      '/v1/balance',
      { config },
    );

    expect(fetchMock.mock.calls[0][0]).toBe('https://omni.mojo-pay.com/v1/oauth/token');
  });
});
