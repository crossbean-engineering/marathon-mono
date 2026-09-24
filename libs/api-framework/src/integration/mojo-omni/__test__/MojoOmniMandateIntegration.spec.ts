import {
  MojoOmniMandateIntegration,
  toOmniMandate,
  toOmniMandateDebit,
  toOmniSubscription,
  toOmniSubscriptionPlan,
} from '../MojoOmniMandateIntegration';
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

describe('toOmniMandate', () => {
  it.each([
    ['succeeded', 'approved'],
    ['cancelled', 'cancelled'],
    ['failed', 'rejected'],
    ['processing', 'pending'],
  ])('maps %s to %s and keeps the raw body', (status, expected) => {
    const result = toOmniMandate({ mandate_id: 'MND_1', status, extra: true });
    expect(result.mandateId).toBe('MND_1');
    expect(result.mandateStatus).toBe(expected);
    expect(result.raw['extra']).toBe(true);
  });
});

describe('toOmniMandateDebit', () => {
  it('normalises the amount and maps the payment status', () => {
    const result = toOmniMandateDebit({
      mandate_id: 'MND_1',
      merchant_reference: 'REF-1',
      status: 'succeeded',
      amount: '2.50',
      currency: 'GHS',
    });
    expect(result.amount).toBe(250);
    expect(result.paymentStatus).toBe('completed');
    expect(result.merchantReference).toBe('REF-1');
  });
});

describe('toOmniSubscriptionPlan', () => {
  it('converts a well-formed plan', () => {
    const plan = toOmniSubscriptionPlan({
      plan_id: 'PLN_1',
      name: 'Monthly',
      currency: 'GHS',
      amount: '50.00',
      frequency: 'MONTHLY',
      status: 'active',
      duration_months: null,
    });

    expect(plan.amount).toBe(5000);
    expect(plan.frequency).toBe('MONTHLY');
    expect(plan.durationMonths).toBeNull();
  });

  it('leaves an unreadable amount undefined instead of pricing the plan at zero', () => {
    expect(() =>
      toOmniSubscriptionPlan({ plan_id: 'PLN_1', name: 'Monthly', amount: 25 }),
    ).toThrow(/"amount"/);

    expect(
      toOmniSubscriptionPlan({ plan_id: 'PLN_1', name: 'Monthly' }).amount,
    ).toBeUndefined();
  });

  it('leaves an unrecognised frequency undefined rather than lying about the type', () => {
    expect(
      toOmniSubscriptionPlan({ plan_id: 'PLN_1', frequency: 'FORTNIGHTLY' }).frequency,
    ).toBeUndefined();
    expect(toOmniSubscriptionPlan({ plan_id: 'PLN_1' }).frequency).toBeUndefined();
  });
});

describe('toOmniSubscription', () => {
  it('keeps the raw body for undocumented fields', () => {
    const result = toOmniSubscription({ subscription_id: 'SUB_1', anything: 42 });
    expect(result.subscriptionId).toBe('SUB_1');
    expect(result.raw['anything']).toBe(42);
  });
});

describe('MojoOmniMandateIntegration', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function newIntegration() {
    return new MojoOmniMandateIntegration({ environment: 'dev' });
  }

  it('creates a mandate with snake_case fields and a decimal amount', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(201, { mandate_id: 'MND_1', status: 'processing' }),
      );

    const result = await newIntegration().createMandate(
      {
        mobile: '233200000000',
        provider: 'MTN',
        currency: 'GHS',
        amount: 5000,
        frequency: 'MONTHLY',
        startsAt: '2026-09-01T00:00:00Z',
        merchantReference: 'REF-1',
        description: 'Monthly giving',
      },
      config,
      'idem-1',
    );

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://omni.mojo-pay.com/v1/mandates');
    expect(JSON.parse(init.body)).toEqual({
      mobile: '233200000000',
      provider: 'MTN',
      currency: 'GHS',
      amount: '50.00',
      frequency: 'MONTHLY',
      starts_at: '2026-09-01T00:00:00Z',
      merchant_reference: 'REF-1',
      description: 'Monthly giving',
    });
    expect(result.mandateStatus).toBe('pending');
  });

  it('requires customer name and email when plan_id is set', async () => {
    await expect(
      newIntegration().createMandate(
        {
          mobile: '233200000000',
          provider: 'MTN',
          currency: 'GHS',
          amount: 5000,
          frequency: 'MONTHLY',
          startsAt: '2026-09-01T00:00:00Z',
          merchantReference: 'REF-1',
          planId: 'PLN_1',
        },
        config,
        'idem-2',
      ),
    ).rejects.toThrow(/customerName and customerEmail/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('gets a mandate by merchant reference', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(200, { mandate_id: 'MND_1', status: 'succeeded' }),
      );

    const result = await newIntegration().getMandateByReference('REF-1', config);

    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://omni.mojo-pay.com/v1/mandates?merchant_reference=REF-1',
    );
    expect(result.mandateStatus).toBe('approved');
  });

  it('cancels a mandate', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(200, { mandate_id: 'MND_1', status: 'cancelled' }),
      );

    const result = await newIntegration().cancelMandate(
      'MND_1',
      { mobile: '233200000000', reason: 'Donor request' },
      config,
      'idem-3',
    );

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://omni.mojo-pay.com/v1/mandates/MND_1/cancel');
    expect(JSON.parse(init.body)).toEqual({
      mobile: '233200000000',
      reason: 'Donor request',
    });
    expect(result.mandateStatus).toBe('cancelled');
  });

  it('creates a mandate debit', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(201, { mandate_id: 'MND_1', status: 'processing' }),
      );

    await newIntegration().createMandateDebit(
      'MND_1',
      { amount: 250, currency: 'GHS', merchantReference: 'REF-D1', provider: 'MTN' },
      config,
      'idem-4',
    );

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://omni.mojo-pay.com/v1/mandates/MND_1/debits');
    expect(JSON.parse(init.body)).toEqual({
      amount: '2.50',
      currency: 'GHS',
      merchant_reference: 'REF-D1',
      provider: 'MTN',
    });
  });

  it('gets a mandate debit status from the query parameters', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { status: 'failed' }));

    const result = await newIntegration().getMandateDebitStatus(
      { mandateId: 'MND_1', merchantReference: 'REF-D1' },
      config,
    );

    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://omni.mojo-pay.com/v1/mandate_debits/status?mandate_id=MND_1&merchant_reference=REF-D1',
    );
    expect(result.paymentStatus).toBe('failed');
  });
});

describe('MojoOmniMandateIntegration subscriptions', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function newIntegration() {
    return new MojoOmniMandateIntegration({ environment: 'dev' });
  }

  it('unwraps the list envelope and converts plan amounts to pesewas', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          object: 'list',
          data: [
            {
              object: 'subscription_plan',
              plan_id: 'PLN_1',
              name: 'Monthly',
              currency: 'GHS',
              amount: '50.00',
              frequency: 'MONTHLY',
              status: 'active',
              duration_months: null,
            },
          ],
        }),
      );

    const plans = await newIntegration().listSubscriptionPlans(config);

    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://omni.mojo-pay.com/v1/subscription_plans',
    );
    expect(plans).toHaveLength(1);
    expect(plans[0].planId).toBe('PLN_1');
    expect(plans[0].amount).toBe(5000);
    expect(plans[0].frequency).toBe('MONTHLY');
    expect(plans[0].durationMonths).toBeNull();
  });

  it('returns an empty array when the envelope has no data', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(jsonResponse(200, { object: 'list' }));

    expect(await newIntegration().listSubscriptionPlans(config)).toEqual([]);
  });

  it('enrolls a subscription', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(201, {
          object: 'subscription',
          subscription_id: 'SUB_1',
          status: 'processing',
          merchant_reference: 'REF-S1',
          plan_id: 'PLN_1',
          mandate_id: 'MND_1',
        }),
      );

    const result = await newIntegration().createSubscription(
      {
        planId: 'PLN_1',
        merchantReference: 'REF-S1',
        customerName: 'Ama Mensah',
        customerEmail: 'ama@example.com',
        mobile: '233200000000',
        provider: 'MTN',
      },
      config,
      'idem-sub-1',
    );

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://omni.mojo-pay.com/v1/subscriptions');
    expect(init.headers['Idempotency-Key']).toBe('idem-sub-1');
    expect(JSON.parse(init.body)).toEqual({
      plan_id: 'PLN_1',
      merchant_reference: 'REF-S1',
      customer_name: 'Ama Mensah',
      customer_email: 'ama@example.com',
      mobile: '233200000000',
      provider: 'MTN',
    });
    expect(result.subscriptionId).toBe('SUB_1');
    expect(result.mandateId).toBe('MND_1');
  });

  it('gets a subscription by merchant reference', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, tokenBody))
      .mockResolvedValueOnce(
        jsonResponse(200, { subscription_id: 'SUB_1', status: 'active' }),
      );

    const result = await newIntegration().getSubscriptionByReference(
      'REF-S1',
      config,
    );

    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://omni.mojo-pay.com/v1/subscriptions?merchant_reference=REF-S1',
    );
    expect(result.status).toBe('active');
  });
});
