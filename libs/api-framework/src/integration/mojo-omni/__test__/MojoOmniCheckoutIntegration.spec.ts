import {
  MojoOmniCheckoutIntegration,
  toOmniCheckoutSession,
} from '../MojoOmniCheckoutIntegration';
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

describe('toOmniCheckoutSession', () => {
  it('normalises amounts and nullable rail fields', () => {
    const result = toOmniCheckoutSession({
      id: 'CS_1',
      status: 'succeeded',
      currency: 'GHS',
      amount_mode: 'fixed',
      amount: '1.00',
      amount_payable: '1.02',
      merchant_reference: 'REF-1',
      mobile: null,
      payment_rail: null,
      provider: null,
      card_scheme: null,
    });

    expect(result.amount).toBe(100);
    expect(result.amountPayable).toBe(102);
    expect(result.amountMode).toBe('fixed');
    expect(result.paymentStatus).toBe('completed');
    expect(result.mobile).toBeNull();
    expect(result.paymentRail).toBeNull();
  });

  it.each(['cancelled', 'expired'])(
    'maps a %s session to a terminal failed paymentStatus, not pending',
    (status) => {
      const result = toOmniCheckoutSession({
        id: 'CS_1',
        status,
        currency: 'GHS',
        merchant_reference: 'REF-1',
      });

      expect(result.status).toBe(status);
      expect(result.paymentStatus).toBe('failed');
    },
  );
});

describe('MojoOmniCheckoutIntegration', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function newIntegration() {
    return new MojoOmniCheckoutIntegration({ environment: 'dev' });
  }

  it('creates a fixed-amount session', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(201, {
          id: 'CS_1',
          object: 'checkout_session',
          status: 'processing',
          currency: 'GHS',
          amount_mode: 'fixed',
          amount: '1.00',
          fee_amount: '0.02',
          fee_mode: 'on_top',
          amount_payable: '1.02',
          merchant_settlement_amount: '1.00',
          url: 'https://checkout.example.com/pay/CS_1',
          expires_at: '2026-04-15T11:00:00Z',
        }),
      );

    const result = await newIntegration().createCheckoutSession(
      {
        amount: 100,
        currency: 'GHS',
        merchantReference: 'REF-1',
        successUrl: 'https://app.test/ok',
        cancelUrl: 'https://app.test/no',
      },
      config,
      'idem-1',
    );

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://omni.mojo-pay.com/v1/checkout/sessions');
    expect(JSON.parse(init.body)).toEqual({
      amount_mode: 'fixed',
      amount: '1.00',
      currency: 'GHS',
      merchant_reference: 'REF-1',
      success_url: 'https://app.test/ok',
      cancel_url: 'https://app.test/no',
    });
    expect(result.id).toBe('CS_1');
    expect(result.url).toBe('https://checkout.example.com/pay/CS_1');
    expect(result.amount).toBe(100);
    expect(result.amountPayable).toBe(102);
    expect(result.expiresAt).toBe('2026-04-15T11:00:00Z');
  });

  it('creates an open-amount session without an amount', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(201, {
          id: 'CS_2',
          status: 'processing',
          url: 'u',
          expires_at: 'e',
        }),
      );

    await newIntegration().createCheckoutSession(
      {
        amountMode: 'open',
        currency: 'GHS',
        merchantReference: 'REF-2',
        successUrl: 'https://app.test/ok',
        cancelUrl: 'https://app.test/no',
      },
      config,
      'idem-2',
    );

    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.amount_mode).toBe('open');
    expect(body).not.toHaveProperty('amount');
  });

  it('sends payment_rail and mobile when a rail is chosen', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(201, {
          id: 'CS_3',
          status: 'processing',
          url: 'u',
          expires_at: 'e',
        }),
      );

    await newIntegration().createCheckoutSession(
      {
        amount: 500,
        currency: 'GHS',
        merchantReference: 'REF-3',
        successUrl: 'https://app.test/ok',
        cancelUrl: 'https://app.test/no',
        paymentRail: 'mobile_money',
        mobile: '233200000000',
        provider: 'MTN',
      },
      config,
      'idem-3',
    );

    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.payment_rail).toBe('mobile_money');
    expect(body.mobile).toBe('233200000000');
    expect(body.provider).toBe('MTN');
  });

  it('requires an amount when the mode is fixed', async () => {
    await expect(
      newIntegration().createCheckoutSession(
        {
          currency: 'GHS',
          merchantReference: 'REF-4',
          successUrl: 'https://app.test/ok',
          cancelUrl: 'https://app.test/no',
        },
        config,
        'idem-4',
      ),
    ).rejects.toThrow(/amount is required/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an amount when the mode is open', async () => {
    await expect(
      newIntegration().createCheckoutSession(
        {
          amountMode: 'open',
          amount: 100,
          currency: 'GHS',
          merchantReference: 'REF-5',
          successUrl: 'https://app.test/ok',
          cancelUrl: 'https://app.test/no',
        },
        config,
        'idem-5',
      ),
    ).rejects.toThrow(/amount must be omitted/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws rather than returning a session with an empty redirect url', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(201, { id: 'CS_9', status: 'processing' }));

    // Defaulting url to '' would look like a working session and send the
    // payer to an empty redirect.
    await expect(
      newIntegration().createCheckoutSession(
        {
          amount: 100,
          currency: 'GHS',
          merchantReference: 'REF-9',
          successUrl: 'https://app.test/ok',
          cancelUrl: 'https://app.test/no',
        },
        config,
        'idem-9',
      ),
    ).rejects.toThrow(/without a url/i);
  });

  it('gets a session by id', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { id: 'CS_1', status: 'succeeded' }));

    const result = await newIntegration().getCheckoutSession('CS_1', config);

    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://omni.mojo-pay.com/v1/checkout/sessions/CS_1',
    );
    expect(result.paymentStatus).toBe('completed');
  });
});
