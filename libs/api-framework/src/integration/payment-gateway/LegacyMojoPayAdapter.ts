import {
  MojoPayIntegration,
  MojoCollectionIntegration,
  MojoDirectDebitIntegration,
  MojoPayConfig,
} from '../mojopay';
import { PaymentEnv } from '../../utils/payment-url';
import { GatewayCapabilityNotSupportedError } from './errors';
import {
  PaymentGatewayFacade,
  PaymentGatewayProvider,
  GatewayCapability,
  GatewayCollectPaymentParams,
  GatewayPaymentResult,
  GatewayHostedCheckoutParams,
  GatewayHostedCheckoutResult,
  GatewayReference,
  GatewayCreateMandateParams,
  GatewayMandateResult,
  GatewayCancelMandateParams,
  GatewayMandateDebitParams,
} from './types';

const PESEWAS_PER_UNIT = 100;

const UNSUPPORTED_CAPABILITIES: readonly GatewayCapability[] = [
  'subscriptions',
  'verifications',
  'balance',
  'payouts',
  'subAccounts',
];

/**
 * Wraps the three legacy MojoPay classes behind PaymentGatewayFacade.
 *
 * The legacy API's Amount/amount fields are GHS decimals, not pesewas —
 * unlike Omni, which is pesewa-integer end to end at the client boundary.
 * Every existing app caller of the legacy classes divides by 100 inline
 * before calling them (see PaymentProcessor.ts in donation/gift-registry).
 * This adapter is now the one place that division lives — see
 * docs/mojo-omni-app-integration-design.md § "LegacyMojoPayAdapter".
 */
export class LegacyMojoPayAdapter implements PaymentGatewayFacade {
  readonly provider: PaymentGatewayProvider = 'legacy';

  private readonly collection: MojoCollectionIntegration;
  private readonly hostedCheckout: MojoPayIntegration;
  private readonly directDebit: MojoDirectDebitIntegration;
  private readonly credentials: MojoPayConfig;

  constructor(environment: PaymentEnv, credentials: MojoPayConfig) {
    this.collection = new MojoCollectionIntegration({ environment });
    this.hostedCheckout = new MojoPayIntegration({ environment });
    this.directDebit = new MojoDirectDebitIntegration({ environment });
    this.credentials = credentials;
  }

  supports(capability: GatewayCapability): boolean {
    return !UNSUPPORTED_CAPABILITIES.includes(capability);
  }

  private unsupported(capability: GatewayCapability): Promise<never> {
    return Promise.reject(new GatewayCapabilityNotSupportedError(capability, 'legacy'));
  }

  async collectPayment(
    params: GatewayCollectPaymentParams,
    _idempotencyKey: string,
  ): Promise<GatewayPaymentResult> {
    const response = await this.collection.initPayment(
      {
        Network: params.provider,
        Mobile: params.mobile,
        Currency: params.currency,
        CountryCode: 'GH',
        Amount: params.amount / PESEWAS_PER_UNIT,
        OrderId: params.merchantReference,
        OrderDesc: params.description ?? params.merchantReference,
      },
      this.credentials,
    );
    return {
      status: this.collection.mapToPaymentStatus(response.statusCode),
      providerReference: String(response.transactionId),
      merchantReference: params.merchantReference,
      amount: params.amount,
      raw: response,
    };
  }

  async getPaymentStatus(reference: GatewayReference): Promise<GatewayPaymentResult> {
    const { response, paymentStatus } = await this.collection.queryStatus(
      reference.merchantReference,
      this.credentials,
    );
    return {
      status: paymentStatus,
      merchantReference: reference.merchantReference,
      amount: response.orderAmount,
      raw: response,
    };
  }

  async initiateHostedCheckout(
    params: GatewayHostedCheckoutParams,
    _idempotencyKey: string,
  ): Promise<GatewayHostedCheckoutResult> {
    if (params.amount === undefined) {
      throw new Error(
        'amount is required for the legacy hosted checkout adapter — legacy has no open-amount mode.',
      );
    }
    const description = params.description ?? params.merchantReference;
    const { response } = await this.hostedCheckout.initiatePayment(
      {
        feetypecode: description,
        currency: params.currency,
        amount: params.amount / PESEWAS_PER_UNIT,
        order_id: params.merchantReference,
        order_desc: description,
        return_url: params.successUrl,
        mobile: params.customerMobile,
        email: params.customerEmail,
        name: params.customerName,
      },
      this.credentials,
    );
    return {
      redirectUrl: response.redirect_url,
      providerReference: response.Token,
      raw: response,
    };
  }

  async getHostedCheckoutStatus(reference: GatewayReference): Promise<GatewayPaymentResult> {
    const { invoice, paymentStatus } = await this.hostedCheckout.getInvoice(
      reference.merchantReference,
      this.credentials,
    );
    return {
      status: paymentStatus,
      merchantReference: reference.merchantReference,
      amount: invoice.amount,
      raw: invoice,
    };
  }

  async createMandate(
    params: GatewayCreateMandateParams,
    _idempotencyKey: string,
  ): Promise<GatewayMandateResult> {
    const response = await this.directDebit.createMandate(
      {
        Mobile: params.mobile,
        Network: params.provider,
        Amount: params.amount / PESEWAS_PER_UNIT,
        Currency: params.currency,
        Frequency: params.frequency,
        StartDate: params.startsAt,
        EndDate: params.endsAt,
        Data: {
          MerchantReferenceId: params.merchantReference,
          Description: params.description ?? params.merchantReference,
        },
      },
      this.credentials,
    );
    // Legacy create-mandate is accept-and-process: the response carries a
    // MessageId (a processing correlation reference), NEVER the real
    // MandateId that cancelMandate/debitMandate require. Handing MessageId
    // back as providerReference would let a caller pass it straight into
    // cancelMandate and fail against the real API. providerReference is left
    // undefined here on purpose — callers must poll
    // getMandateStatus({ merchantReference }) until it returns one.
    return {
      status: 'pending',
      providerReference: undefined,
      merchantReference: params.merchantReference,
      raw: response,
    };
  }

  async cancelMandate(
    params: GatewayCancelMandateParams,
    _idempotencyKey: string,
  ): Promise<GatewayMandateResult> {
    if (!params.providerReference) {
      throw new Error(
        'LegacyMojoPayAdapter.cancelMandate requires providerReference (the legacy MandateId, obtained from getMandateStatus — createMandate does not return it).',
      );
    }
    const response = await this.directDebit.cancelMandate(
      params.mobile,
      params.providerReference,
      params.reason,
      this.credentials,
    );
    return {
      status: 'cancelled',
      providerReference: params.providerReference,
      merchantReference: params.merchantReference,
      raw: response,
    };
  }

  async debitMandate(
    params: GatewayMandateDebitParams,
    _idempotencyKey: string,
  ): Promise<GatewayPaymentResult> {
    // Legacy has no on-demand debit trigger — a scheduled mandate debit fires
    // on MojoPay's own schedule. This method is a STATUS CHECK against that
    // scheduled debit, not a request to debit now. Do not read it as
    // symmetric with Omni's createMandateDebit, which genuinely triggers one.
    // See the capability matrix in docs/mojo-omni-app-integration-design.md.
    const { response, paymentStatus } = await this.directDebit.getPaymentStatus(
      params.mandateReference,
      params.merchantReference,
      this.credentials,
    );
    return {
      status: paymentStatus,
      providerReference: params.mandateReference,
      merchantReference: params.merchantReference,
      raw: response,
    };
  }

  async getMandateStatus(reference: GatewayReference): Promise<GatewayMandateResult> {
    const { response, mandateStatus } = await this.directDebit.getMandateStatus(
      reference.merchantReference,
      this.credentials,
    );
    return {
      status: mandateStatus,
      providerReference: response.MandateId,
      merchantReference: reference.merchantReference,
      raw: response,
    };
  }

  listSubscriptionPlans(): Promise<never> {
    return this.unsupported('subscriptions');
  }
  createSubscription(): Promise<never> {
    return this.unsupported('subscriptions');
  }
  getSubscription(): Promise<never> {
    return this.unsupported('subscriptions');
  }
  verifyMobileNumber(): Promise<never> {
    return this.unsupported('verifications');
  }
  verifyBankAccount(): Promise<never> {
    return this.unsupported('verifications');
  }
  getBanks(): Promise<never> {
    return this.unsupported('verifications');
  }
  getMobileProviders(): Promise<never> {
    return this.unsupported('verifications');
  }
  getBalance(): Promise<never> {
    return this.unsupported('balance');
  }
  createPayout(): Promise<never> {
    return this.unsupported('payouts');
  }
  getPayoutStatus(): Promise<never> {
    return this.unsupported('payouts');
  }
  getAccountContext(): Promise<never> {
    return this.unsupported('subAccounts');
  }
}
