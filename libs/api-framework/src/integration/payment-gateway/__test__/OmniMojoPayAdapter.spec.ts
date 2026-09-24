import { OmniMojoPayAdapter } from '../OmniMojoPayAdapter';
import {
  MojoOmniCollectionIntegration,
  MojoOmniCheckoutIntegration,
  MojoOmniMandateIntegration,
  MojoOmniVerificationIntegration,
  MojoOmniBalanceIntegration,
  MojoOmniPayoutIntegration,
  MojoOmniConfig,
} from '../../mojo-omni';

const credentials: MojoOmniConfig = { clientId: 'c', clientSecret: 's' };

function newAdapter() {
  return new OmniMojoPayAdapter('dev', credentials);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('OmniMojoPayAdapter — collectPayment / getPaymentStatus', () => {
  it('delegates collectPayment to createCollection and maps the result', async () => {
    const createCollection = jest.spyOn(MojoOmniCollectionIntegration.prototype, 'createCollection').mockResolvedValue({
      id: 'COL_1',
      status: 'succeeded',
      paymentStatus: 'completed',
      merchantReference: 'REF-1',
      currency: 'GHS',
      amount: 100,
      raw: { id: 'COL_1' },
    });

    const result = await newAdapter().collectPayment(
      { amount: 100, currency: 'GHS', mobile: '233200000000', provider: 'MTN', merchantReference: 'REF-1' },
      'idem-1',
    );

    expect(createCollection).toHaveBeenCalledWith(
      { amount: 100, currency: 'GHS', merchantReference: 'REF-1', mobile: '233200000000', provider: 'MTN', description: undefined },
      credentials,
      'idem-1',
    );
    expect(result).toEqual({
      status: 'completed',
      providerReference: 'COL_1',
      merchantReference: 'REF-1',
      amount: 100,
      raw: { id: 'COL_1' },
    });
  });

  it('getPaymentStatus looks up by id when providerReference is present', async () => {
    const getCollectionById = jest.spyOn(MojoOmniCollectionIntegration.prototype, 'getCollectionById').mockResolvedValue({
      id: 'COL_1',
      paymentStatus: 'completed',
      merchantReference: 'REF-1',
      raw: {},
    });
    const getCollectionByReference = jest.spyOn(MojoOmniCollectionIntegration.prototype, 'getCollectionByReference');

    await newAdapter().getPaymentStatus({ merchantReference: 'REF-1', providerReference: 'COL_1' });

    expect(getCollectionById).toHaveBeenCalledWith('COL_1', credentials);
    expect(getCollectionByReference).not.toHaveBeenCalled();
  });

  it('getPaymentStatus falls back to merchantReference lookup when providerReference is absent', async () => {
    const getCollectionByReference = jest
      .spyOn(MojoOmniCollectionIntegration.prototype, 'getCollectionByReference')
      .mockResolvedValue({ id: 'COL_2', paymentStatus: 'pending', merchantReference: 'REF-2', raw: {} });

    await newAdapter().getPaymentStatus({ merchantReference: 'REF-2' });

    expect(getCollectionByReference).toHaveBeenCalledWith('REF-2', credentials);
  });
});

describe('OmniMojoPayAdapter — hosted checkout', () => {
  it('throws when cancelUrl is omitted — Omni checkout sessions always require one', async () => {
    await expect(
      newAdapter().initiateHostedCheckout(
        { currency: 'GHS', merchantReference: 'REF-3', successUrl: 'https://app/return' },
        'idem-3',
      ),
    ).rejects.toThrow(/cancelUrl/i);
  });

  it('passes amountMode fixed when an amount is given', async () => {
    const createCheckoutSession = jest
      .spyOn(MojoOmniCheckoutIntegration.prototype, 'createCheckoutSession')
      .mockResolvedValue({ id: 'CS_1', status: 'processing', url: 'https://pay/CS_1', expiresAt: '', raw: {} });

    await newAdapter().initiateHostedCheckout(
      {
        amount: 1000,
        currency: 'GHS',
        merchantReference: 'REF-4',
        successUrl: 'https://app/return',
        cancelUrl: 'https://app/cancel',
      },
      'idem-4',
    );

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ amountMode: 'fixed', amount: 1000 }),
      credentials,
      'idem-4',
    );
  });

  it('passes amountMode open and no amount when amount is omitted', async () => {
    const createCheckoutSession = jest
      .spyOn(MojoOmniCheckoutIntegration.prototype, 'createCheckoutSession')
      .mockResolvedValue({ id: 'CS_2', status: 'processing', url: 'https://pay/CS_2', expiresAt: '', raw: {} });

    await newAdapter().initiateHostedCheckout(
      { currency: 'GHS', merchantReference: 'REF-5', successUrl: 'https://app/return', cancelUrl: 'https://app/cancel' },
      'idem-5',
    );

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ amountMode: 'open', amount: undefined }),
      credentials,
      'idem-5',
    );
  });

  it('sets payment_rail to mobile_money and forwards the number when customerMobile is given, so the hosted page pre-fills it', async () => {
    const createCheckoutSession = jest
      .spyOn(MojoOmniCheckoutIntegration.prototype, 'createCheckoutSession')
      .mockResolvedValue({ id: 'CS_6', status: 'processing', url: 'https://pay/CS_6', expiresAt: '', raw: {} });

    await newAdapter().initiateHostedCheckout(
      {
        currency: 'GHS',
        merchantReference: 'REF-6',
        successUrl: 'https://app/return',
        cancelUrl: 'https://app/cancel',
        customerMobile: '233200000000',
      },
      'idem-6',
    );

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ mobile: '233200000000', paymentRail: 'mobile_money' }),
      credentials,
      'idem-6',
    );
  });

  it('leaves payment_rail unset when no customerMobile is given, so the payer still gets the on-page rail picker', async () => {
    const createCheckoutSession = jest
      .spyOn(MojoOmniCheckoutIntegration.prototype, 'createCheckoutSession')
      .mockResolvedValue({ id: 'CS_7', status: 'processing', url: 'https://pay/CS_7', expiresAt: '', raw: {} });

    await newAdapter().initiateHostedCheckout(
      {
        currency: 'GHS',
        merchantReference: 'REF-7',
        successUrl: 'https://app/return',
        cancelUrl: 'https://app/cancel',
      },
      'idem-7',
    );

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ mobile: undefined, paymentRail: undefined }),
      credentials,
      'idem-7',
    );
  });

  it('maps the created session into redirectUrl and providerReference', async () => {
    jest
      .spyOn(MojoOmniCheckoutIntegration.prototype, 'createCheckoutSession')
      .mockResolvedValue({ id: 'CS_3', status: 'processing', url: 'https://pay/CS_3', expiresAt: '', raw: { id: 'CS_3' } });

    const result = await newAdapter().initiateHostedCheckout(
      { amount: 500, currency: 'GHS', merchantReference: 'REF-6', successUrl: 'https://app/return', cancelUrl: 'https://app/cancel' },
      'idem-6',
    );

    expect(result).toEqual({ redirectUrl: 'https://pay/CS_3', providerReference: 'CS_3', raw: { id: 'CS_3' } });
  });

  it('getHostedCheckoutStatus throws when providerReference is missing — Omni has no reference-based lookup', async () => {
    await expect(newAdapter().getHostedCheckoutStatus({ merchantReference: 'REF-7' })).rejects.toThrow(
      /providerReference/i,
    );
  });

  it('getHostedCheckoutStatus delegates to getCheckoutSession by id', async () => {
    const getCheckoutSession = jest
      .spyOn(MojoOmniCheckoutIntegration.prototype, 'getCheckoutSession')
      .mockResolvedValue({ id: 'CS_4', paymentStatus: 'completed', merchantReference: 'REF-8', raw: {} });

    const result = await newAdapter().getHostedCheckoutStatus({ merchantReference: 'REF-8', providerReference: 'CS_4' });

    expect(getCheckoutSession).toHaveBeenCalledWith('CS_4', credentials);
    expect(result.status).toBe('completed');
  });
});

describe('OmniMojoPayAdapter — mandates', () => {
  it('createMandate delegates and maps mandateId to providerReference', async () => {
    const createMandate = jest.spyOn(MojoOmniMandateIntegration.prototype, 'createMandate').mockResolvedValue({
      mandateId: 'MND_1',
      status: 'processing',
      mandateStatus: 'pending',
      merchantReference: 'REF-9',
      raw: {},
    });

    const result = await newAdapter().createMandate(
      {
        mobile: '1',
        provider: 'MTN',
        amount: 100,
        currency: 'GHS',
        frequency: 'MONTHLY',
        startsAt: '2026-01-01T00:00:00Z',
        endsAt: '2027-01-01T00:00:00Z',
        merchantReference: 'REF-9',
      },
      'idem-9',
    );

    expect(createMandate).toHaveBeenCalledWith(
      expect.objectContaining({ mobile: '1', provider: 'MTN', amount: 100, merchantReference: 'REF-9' }),
      credentials,
      'idem-9',
    );
    expect(result.providerReference).toBe('MND_1');
    expect(result.status).toBe('pending');
  });

  it('cancelMandate throws when providerReference is missing', async () => {
    await expect(
      newAdapter().cancelMandate({ merchantReference: 'REF-10', mobile: '1', reason: 'customer request' }, 'idem-10'),
    ).rejects.toThrow(/providerReference/i);
  });

  it('cancelMandate delegates with the mandateId when providerReference is present', async () => {
    const cancelMandate = jest.spyOn(MojoOmniMandateIntegration.prototype, 'cancelMandate').mockResolvedValue({
      mandateId: 'MND_2',
      status: 'cancelled',
      mandateStatus: 'cancelled',
      merchantReference: 'REF-11',
      raw: {},
    });

    const result = await newAdapter().cancelMandate(
      { merchantReference: 'REF-11', providerReference: 'MND_2', mobile: '1', reason: 'customer request' },
      'idem-11',
    );

    expect(cancelMandate).toHaveBeenCalledWith('MND_2', { mobile: '1', reason: 'customer request' }, credentials, 'idem-11');
    expect(result.status).toBe('cancelled');
  });

  it('debitMandate delegates to createMandateDebit — this genuinely triggers a debit on Omni', async () => {
    const createMandateDebit = jest.spyOn(MojoOmniMandateIntegration.prototype, 'createMandateDebit').mockResolvedValue({
      mandateId: 'MND_3',
      merchantReference: 'REF-12',
      status: 'succeeded',
      paymentStatus: 'completed',
      amount: 100,
      raw: {},
    });

    const result = await newAdapter().debitMandate(
      { mandateReference: 'MND_3', merchantReference: 'REF-12', amount: 100, currency: 'GHS', provider: 'MTN' },
      'idem-12',
    );

    expect(createMandateDebit).toHaveBeenCalledWith(
      'MND_3',
      { amount: 100, currency: 'GHS', merchantReference: 'REF-12', provider: 'MTN' },
      credentials,
      'idem-12',
    );
    expect(result.status).toBe('completed');
  });

  it('getMandateStatus looks up by merchantReference, not providerReference', async () => {
    const getMandateByReference = jest
      .spyOn(MojoOmniMandateIntegration.prototype, 'getMandateByReference')
      .mockResolvedValue({ mandateId: 'MND_4', mandateStatus: 'approved', merchantReference: 'REF-13', raw: {} });

    const result = await newAdapter().getMandateStatus({ merchantReference: 'REF-13' });

    expect(getMandateByReference).toHaveBeenCalledWith('REF-13', credentials);
    expect(result.providerReference).toBe('MND_4');
  });
});

describe('OmniMojoPayAdapter — Omni-only capabilities: thin passthrough', () => {
  it('listSubscriptionPlans delegates', async () => {
    const spy = jest.spyOn(MojoOmniMandateIntegration.prototype, 'listSubscriptionPlans').mockResolvedValue([]);
    await newAdapter().listSubscriptionPlans();
    expect(spy).toHaveBeenCalledWith(credentials);
  });

  it('createSubscription delegates', async () => {
    const params = {
      planId: 'PLAN_1',
      merchantReference: 'REF-14',
      customerName: 'A',
      customerEmail: 'a@b.com',
      mobile: '1',
      provider: 'MTN',
    };
    const spy = jest
      .spyOn(MojoOmniMandateIntegration.prototype, 'createSubscription')
      .mockResolvedValue({ subscriptionId: 'SUB_1', raw: {} });
    await newAdapter().createSubscription(params, 'idem-14');
    expect(spy).toHaveBeenCalledWith(params, credentials, 'idem-14');
  });

  it('getSubscription delegates to getSubscriptionByReference', async () => {
    const spy = jest
      .spyOn(MojoOmniMandateIntegration.prototype, 'getSubscriptionByReference')
      .mockResolvedValue({ subscriptionId: 'SUB_1', raw: {} });
    await newAdapter().getSubscription('REF-15');
    expect(spy).toHaveBeenCalledWith('REF-15', credentials);
  });

  it('verifyMobileNumber delegates to verifyMsisdn', async () => {
    const spy = jest
      .spyOn(MojoOmniVerificationIntegration.prototype, 'verifyMsisdn')
      .mockResolvedValue({ status: 'verified', raw: {} });
    await newAdapter().verifyMobileNumber({ mobile: '1' });
    expect(spy).toHaveBeenCalledWith({ mobile: '1' }, credentials);
  });

  it('verifyBankAccount delegates', async () => {
    const spy = jest
      .spyOn(MojoOmniVerificationIntegration.prototype, 'verifyBankAccount')
      .mockResolvedValue({ status: 'verified', raw: {} });
    await newAdapter().verifyBankAccount({ bankCode: 'B', accountNumber: '1' });
    expect(spy).toHaveBeenCalledWith({ bankCode: 'B', accountNumber: '1' }, credentials);
  });

  it('getBanks / getMobileProviders / getAccountContext delegate', async () => {
    const banks = jest.spyOn(MojoOmniVerificationIntegration.prototype, 'getBanks').mockResolvedValue({});
    const providers = jest.spyOn(MojoOmniVerificationIntegration.prototype, 'getMobileProviders').mockResolvedValue({});
    const account = jest
      .spyOn(MojoOmniVerificationIntegration.prototype, 'getAccountContext')
      .mockResolvedValue({ merchant: {}, raw: {} });

    const adapter = newAdapter();
    await adapter.getBanks();
    await adapter.getMobileProviders();
    await adapter.getAccountContext();

    expect(banks).toHaveBeenCalledWith(credentials);
    expect(providers).toHaveBeenCalledWith(credentials);
    expect(account).toHaveBeenCalledWith(credentials);
  });

  it('getBalance delegates', async () => {
    const spy = jest
      .spyOn(MojoOmniBalanceIntegration.prototype, 'getBalance')
      .mockResolvedValue({ currency: 'GHS', available: 0, raw: {} });
    await newAdapter().getBalance({ currency: 'GHS' });
    expect(spy).toHaveBeenCalledWith({ currency: 'GHS' }, credentials);
  });

  it('createPayout / getPayoutStatus delegate', async () => {
    const create = jest.spyOn(MojoOmniPayoutIntegration.prototype, 'createPayout').mockResolvedValue({
      paymentStatus: 'pending',
      raw: {},
    });
    const status = jest
      .spyOn(MojoOmniPayoutIntegration.prototype, 'getPayoutByReference')
      .mockResolvedValue({ paymentStatus: 'completed', raw: {} });

    const payoutParams = {
      type: 'mobile_money' as const,
      amount: 100,
      currency: 'GHS',
      merchantReference: 'REF-16',
      mobile: '1',
      provider: 'MTN',
    };

    await newAdapter().createPayout(payoutParams, 'idem-16');
    await newAdapter().getPayoutStatus('REF-16');

    expect(create).toHaveBeenCalledWith(payoutParams, credentials, 'idem-16');
    expect(status).toHaveBeenCalledWith('REF-16', credentials);
  });
});

describe('OmniMojoPayAdapter — capability reporting', () => {
  it('supports() reports true for every capability', () => {
    const adapter = newAdapter();
    for (const capability of [
      'collectPayment',
      'hostedCheckout',
      'mandates',
      'subscriptions',
      'verifications',
      'balance',
      'payouts',
      'subAccounts',
    ] as const) {
      expect(adapter.supports(capability)).toBe(true);
    }
  });

  it('reports its provider as omni', () => {
    expect(newAdapter().provider).toBe('omni');
  });
});
