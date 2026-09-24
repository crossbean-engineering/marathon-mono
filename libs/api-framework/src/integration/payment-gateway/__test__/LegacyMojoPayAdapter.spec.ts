import { LegacyMojoPayAdapter } from '../LegacyMojoPayAdapter';
import { GatewayCapabilityNotSupportedError } from '../errors';
import { PaymentGatewayFacade } from '../types';
import {
  MojoCollectionIntegration,
  MojoPayIntegration,
  MojoDirectDebitIntegration,
  MojoPayConfig,
} from '../../mojopay';

const credentials: MojoPayConfig = { appId: 'app_1', apiKey: 'key_1' };

function newAdapter() {
  return new LegacyMojoPayAdapter('dev', credentials);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('LegacyMojoPayAdapter — pesewa conversion (the trap this adapter exists to fix)', () => {
  it('divides pesewas by 100 before calling MojoCollectionIntegration.initPayment', async () => {
    const initPayment = jest
      .spyOn(MojoCollectionIntegration.prototype, 'initPayment')
      .mockResolvedValue({ statusCode: 'CL-00-REQUEST-SUBMITTED', statusMessage: 'ok', transactionId: 1 });

    await newAdapter().collectPayment(
      { amount: 12345, currency: 'GHS', mobile: '233200000000', provider: 'MTN', merchantReference: 'REF-1' },
      'idem-1',
    );

    expect(initPayment).toHaveBeenCalledWith(
      expect.objectContaining({ Amount: 123.45, Network: 'MTN', Mobile: '233200000000', OrderId: 'REF-1' }),
      credentials,
    );
  });

  it('divides pesewas by 100 before calling MojoPayIntegration.initiatePayment', async () => {
    const initiatePayment = jest.spyOn(MojoPayIntegration.prototype, 'initiatePayment').mockResolvedValue({
      response: {
        status_code: 1,
        status_message: 'ok',
        trans_ref_no: 1,
        Token: 'TOK-1',
        redirect_url: 'https://pay/TOK-1',
      },
      request: {} as any,
    });

    await newAdapter().initiateHostedCheckout(
      { amount: 50000, currency: 'GHS', merchantReference: 'REF-2', successUrl: 'https://app/return' },
      'idem-2',
    );

    expect(initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 500, order_id: 'REF-2', return_url: 'https://app/return' }),
      credentials,
    );
  });

  it('divides pesewas by 100 before calling MojoDirectDebitIntegration.createMandate', async () => {
    const createMandate = jest
      .spyOn(MojoDirectDebitIntegration.prototype, 'createMandate')
      .mockResolvedValue({ StatusCode: 'DD_ACCEPTED', StatusMessage: 'ok', MessageId: 'M-1' });

    await newAdapter().createMandate(
      {
        mobile: '233200000000',
        provider: 'MTN',
        amount: 7500,
        currency: 'GHS',
        frequency: 'MONTHLY',
        startsAt: '2026-09-01T00:00:00Z',
        endsAt: '2027-09-01T00:00:00Z',
        merchantReference: 'REF-3',
      },
      'idem-3',
    );

    expect(createMandate).toHaveBeenCalledWith(expect.objectContaining({ Amount: 75 }), credentials);
  });
});

describe('LegacyMojoPayAdapter — collectPayment / getPaymentStatus', () => {
  it('maps the response into a GatewayPaymentResult', async () => {
    jest
      .spyOn(MojoCollectionIntegration.prototype, 'initPayment')
      .mockResolvedValue({ statusCode: 'CL-00-REQUEST-SUBMITTED', statusMessage: 'ok', transactionId: 42 });

    const result = await newAdapter().collectPayment(
      { amount: 100, currency: 'GHS', mobile: '1', provider: 'MTN', merchantReference: 'REF-4' },
      'idem-4',
    );

    expect(result.status).toBe('pending');
    expect(result.providerReference).toBe('42');
    expect(result.merchantReference).toBe('REF-4');
    expect(result.amount).toBe(100);
  });

  it('delegates getPaymentStatus to queryStatus and passes through the mapped status', async () => {
    const queryStatus = jest.spyOn(MojoCollectionIntegration.prototype, 'queryStatus').mockResolvedValue({
      response: {
        statusCode: 'CL-01-SUCCESSFULLY-PROCESSED',
        statusMessage: 'ok',
        transactionId: 1,
        orderId: 'REF-5',
        paymentMode: 'MTN',
        remarks: '',
        orderAmount: 500,
        netAmount: 500,
        netAmountDetails: { baseAmount: 500, serviceCharge: 0, taxCharges: 0, otherCharges: 0 },
      },
      paymentStatus: 'completed',
    });

    const result = await newAdapter().getPaymentStatus({ merchantReference: 'REF-5' });

    expect(queryStatus).toHaveBeenCalledWith('REF-5', credentials);
    expect(result.status).toBe('completed');
    expect(result.amount).toBe(500);
  });
});

describe('LegacyMojoPayAdapter — hosted checkout', () => {
  it('throws when amount is omitted — legacy has no open-amount mode', async () => {
    await expect(
      newAdapter().initiateHostedCheckout(
        { currency: 'GHS', merchantReference: 'REF-6', successUrl: 'https://app/return' },
        'idem-6',
      ),
    ).rejects.toThrow(/open-amount/i);
  });

  it('returns the redirect URL and Token as providerReference', async () => {
    jest.spyOn(MojoPayIntegration.prototype, 'initiatePayment').mockResolvedValue({
      response: {
        status_code: 1,
        status_message: 'ok',
        trans_ref_no: 1,
        Token: 'TOK-9',
        redirect_url: 'https://pay/TOK-9',
      },
      request: {} as any,
    });

    const result = await newAdapter().initiateHostedCheckout(
      { amount: 1000, currency: 'GHS', merchantReference: 'REF-7', successUrl: 'https://app/return' },
      'idem-7',
    );

    expect(result.redirectUrl).toBe('https://pay/TOK-9');
    expect(result.providerReference).toBe('TOK-9');
  });

  it('delegates getHostedCheckoutStatus to getInvoice', async () => {
    const getInvoice = jest.spyOn(MojoPayIntegration.prototype, 'getInvoice').mockResolvedValue({
      invoice: {
        status_code: 1,
        status_message: 'PAID BY CLIENT' as any,
        amount: 1000,
        payment_mode: 'MTN' as any,
        order_id: 'REF-8',
        trans_ref_no: '1',
        account_no: '',
        status_desc: '',
        systeM_TRANS_ID: 1,
        telcO_TRANSACTION_ID: '',
        telcO_TRANSACTION_DATE: '',
        reason: '',
      },
      paymentStatus: 'completed',
      paymentMethod: 'momo',
    });

    const result = await newAdapter().getHostedCheckoutStatus({ merchantReference: 'REF-8' });

    expect(getInvoice).toHaveBeenCalledWith('REF-8', credentials);
    expect(result.status).toBe('completed');
    expect(result.amount).toBe(1000);
  });
});

describe('LegacyMojoPayAdapter — mandates', () => {
  it('createMandate leaves providerReference undefined — legacy create does not return a MandateId', async () => {
    jest
      .spyOn(MojoDirectDebitIntegration.prototype, 'createMandate')
      .mockResolvedValue({ StatusCode: 'DD_ACCEPTED', StatusMessage: 'ok', MessageId: 'MSG-1' });

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

    expect(result.status).toBe('pending');
    expect(result.providerReference).toBeUndefined();
    expect(result.merchantReference).toBe('REF-9');
  });

  it('cancelMandate throws synchronously when providerReference is missing, before any network call', async () => {
    const cancelMandate = jest.spyOn(MojoDirectDebitIntegration.prototype, 'cancelMandate');

    await expect(
      newAdapter().cancelMandate({ merchantReference: 'REF-10', mobile: '1', reason: 'customer request' }, 'idem-10'),
    ).rejects.toThrow(/providerReference/i);
    expect(cancelMandate).not.toHaveBeenCalled();
  });

  it('cancelMandate delegates to directDebit.cancelMandate when providerReference is present', async () => {
    const cancelMandate = jest
      .spyOn(MojoDirectDebitIntegration.prototype, 'cancelMandate')
      .mockResolvedValue({ StatusCode: 'DD_ACCEPTED', StatusMessage: 'ok', MessageId: 'MSG-2' });

    const result = await newAdapter().cancelMandate(
      { merchantReference: 'REF-11', providerReference: 'MND-1', mobile: '1', reason: 'customer request' },
      'idem-11',
    );

    expect(cancelMandate).toHaveBeenCalledWith('1', 'MND-1', 'customer request', credentials);
    expect(result.status).toBe('cancelled');
    expect(result.providerReference).toBe('MND-1');
  });

  it('debitMandate is a status check against the provider-scheduled debit, not a trigger', async () => {
    const getPaymentStatus = jest.spyOn(MojoDirectDebitIntegration.prototype, 'getPaymentStatus').mockResolvedValue({
      response: { StatusCode: 'DD_SUCCESSFUL', StatusMessage: 'ok', TransactionId: 1 },
      paymentStatus: 'completed',
    });

    const result = await newAdapter().debitMandate(
      { mandateReference: 'MND-1', merchantReference: 'REF-12', amount: 100, currency: 'GHS', provider: 'MTN' },
      'idem-12',
    );

    expect(getPaymentStatus).toHaveBeenCalledWith('MND-1', 'REF-12', credentials);
    expect(result.status).toBe('completed');
  });

  it('getMandateStatus surfaces the real MandateId as providerReference', async () => {
    jest.spyOn(MojoDirectDebitIntegration.prototype, 'getMandateStatus').mockResolvedValue({
      response: {
        Status: 'APPROVED',
        MandateId: 'MND-2',
        Mandate: {
          MerchantReferenceId: 'REF-13',
          Mobile: '1',
          Network: 'MTN',
          Frequency: 'MONTHLY',
          Narration: '',
          PlatformScheduling: true,
        },
        StatusCode: 'DD_RECORD_FOUND',
        StatusMessage: 'ok',
      },
      mandateStatus: 'approved',
    });

    const result = await newAdapter().getMandateStatus({ merchantReference: 'REF-13' });

    expect(result.status).toBe('approved');
    expect(result.providerReference).toBe('MND-2');
  });
});

describe('LegacyMojoPayAdapter — unsupported capabilities', () => {
  it.each<
    [string, (adapter: PaymentGatewayFacade) => Promise<unknown>]
  >([
    ['listSubscriptionPlans', (a) => a.listSubscriptionPlans()],
    ['createSubscription', (a) => a.createSubscription({} as any, 'k')],
    ['getSubscription', (a) => a.getSubscription('ref')],
    ['verifyMobileNumber', (a) => a.verifyMobileNumber({ mobile: '1' })],
    ['verifyBankAccount', (a) => a.verifyBankAccount({ bankCode: 'b', accountNumber: '1' })],
    ['getBanks', (a) => a.getBanks()],
    ['getMobileProviders', (a) => a.getMobileProviders()],
    ['getBalance', (a) => a.getBalance()],
    ['createPayout', (a) => a.createPayout({} as any, 'k')],
    ['getPayoutStatus', (a) => a.getPayoutStatus('ref')],
    ['getAccountContext', (a) => a.getAccountContext()],
  ])('%s throws GatewayCapabilityNotSupportedError without touching any legacy class', async (_name, call) => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(call(newAdapter())).rejects.toBeInstanceOf(GatewayCapabilityNotSupportedError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('supports() reports false for every capability legacy lacks and true for the rest', () => {
    const adapter = newAdapter();

    expect(adapter.supports('subscriptions')).toBe(false);
    expect(adapter.supports('verifications')).toBe(false);
    expect(adapter.supports('balance')).toBe(false);
    expect(adapter.supports('payouts')).toBe(false);
    expect(adapter.supports('subAccounts')).toBe(false);
    expect(adapter.supports('collectPayment')).toBe(true);
    expect(adapter.supports('hostedCheckout')).toBe(true);
    expect(adapter.supports('mandates')).toBe(true);
  });

  it('reports its provider as legacy', () => {
    expect(newAdapter().provider).toBe('legacy');
  });
});
