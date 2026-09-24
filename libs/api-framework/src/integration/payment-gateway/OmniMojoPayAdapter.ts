import {
  MojoOmniCollectionIntegration,
  MojoOmniCheckoutIntegration,
  MojoOmniMandateIntegration,
  MojoOmniVerificationIntegration,
  MojoOmniBalanceIntegration,
  MojoOmniPayoutIntegration,
  MojoOmniConfig,
  OmniCreateSubscriptionParams,
  OmniSubscription,
  OmniSubscriptionPlan,
  OmniVerificationResult,
  OmniBalance,
  OmniCreatePayoutParams,
  OmniPayout,
  OmniAccountContext,
} from '../mojo-omni';
import { PaymentEnv } from '../../utils/payment-url';
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

/**
 * Wraps the Omni integration classes behind PaymentGatewayFacade. Mostly
 * direct delegation — the facade's shared-tier types were designed to
 * already look like Omni's, unlike the legacy adapter which has real unit
 * and reference-shape conversions to do. See
 * docs/mojo-omni-app-integration-design.md § "OmniMojoPayAdapter".
 */
export class OmniMojoPayAdapter implements PaymentGatewayFacade {
  readonly provider: PaymentGatewayProvider = 'omni';

  private readonly collection: MojoOmniCollectionIntegration;
  private readonly checkout: MojoOmniCheckoutIntegration;
  private readonly mandate: MojoOmniMandateIntegration;
  private readonly verification: MojoOmniVerificationIntegration;
  private readonly balance: MojoOmniBalanceIntegration;
  private readonly payout: MojoOmniPayoutIntegration;
  private readonly credentials: MojoOmniConfig;

  constructor(environment: PaymentEnv, credentials: MojoOmniConfig) {
    this.collection = new MojoOmniCollectionIntegration({ environment });
    this.checkout = new MojoOmniCheckoutIntegration({ environment });
    this.mandate = new MojoOmniMandateIntegration({ environment });
    this.verification = new MojoOmniVerificationIntegration({ environment });
    this.balance = new MojoOmniBalanceIntegration({ environment });
    this.payout = new MojoOmniPayoutIntegration({ environment });
    this.credentials = credentials;
  }

  supports(_capability: GatewayCapability): boolean {
    return true;
  }

  async collectPayment(
    params: GatewayCollectPaymentParams,
    idempotencyKey: string,
  ): Promise<GatewayPaymentResult> {
    const result = await this.collection.createCollection(
      {
        amount: params.amount,
        currency: params.currency,
        merchantReference: params.merchantReference,
        mobile: params.mobile,
        provider: params.provider,
        description: params.description,
      },
      this.credentials,
      idempotencyKey,
    );
    return {
      status: result.paymentStatus,
      providerReference: result.id,
      merchantReference: result.merchantReference,
      amount: result.amount,
      raw: result.raw,
    };
  }

  async getPaymentStatus(reference: GatewayReference): Promise<GatewayPaymentResult> {
    const result = reference.providerReference
      ? await this.collection.getCollectionById(reference.providerReference, this.credentials)
      : await this.collection.getCollectionByReference(reference.merchantReference, this.credentials);
    return {
      status: result.paymentStatus,
      providerReference: result.id,
      merchantReference: result.merchantReference,
      amount: result.amount,
      raw: result.raw,
    };
  }

  async initiateHostedCheckout(
    params: GatewayHostedCheckoutParams,
    idempotencyKey: string,
  ): Promise<GatewayHostedCheckoutResult> {
    if (!params.cancelUrl) {
      throw new Error(
        'cancelUrl is required for the Omni hosted checkout adapter — Omni checkout sessions always require one, unlike legacy.',
      );
    }
    const result = await this.checkout.createCheckoutSession(
      {
        currency: params.currency,
        merchantReference: params.merchantReference,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        amountMode: params.amount === undefined ? 'open' : 'fixed',
        amount: params.amount,
        mobile: params.customerMobile,
        // The doc: mobile is only honoured for pre-filling the hosted page
        // when payment_rail is explicitly 'mobile_money'. Only set it when
        // there's a number to prefill — sending payment_rail with no mobile
        // is rejected as invalid_parameter, and forcing the rail on a payer
        // who gave no number would pre-select a field with nothing in it.
        paymentRail: params.customerMobile ? 'mobile_money' : undefined,
        description: params.description,
      },
      this.credentials,
      idempotencyKey,
    );
    return { redirectUrl: result.url, providerReference: result.id, raw: result.raw };
  }

  async getHostedCheckoutStatus(reference: GatewayReference): Promise<GatewayPaymentResult> {
    if (!reference.providerReference) {
      throw new Error(
        'getHostedCheckoutStatus requires providerReference — Omni checkout sessions are looked up by id, not by merchantReference. Persist the id returned from initiateHostedCheckout.',
      );
    }
    const result = await this.checkout.getCheckoutSession(reference.providerReference, this.credentials);
    return {
      status: result.paymentStatus,
      providerReference: result.id,
      merchantReference: result.merchantReference,
      amount: result.amount,
      raw: result.raw,
    };
  }

  async createMandate(
    params: GatewayCreateMandateParams,
    idempotencyKey: string,
  ): Promise<GatewayMandateResult> {
    const result = await this.mandate.createMandate(
      {
        mobile: params.mobile,
        provider: params.provider,
        currency: params.currency,
        amount: params.amount,
        frequency: params.frequency,
        startsAt: params.startsAt,
        // GatewayCreateMandateParams.endsAt is required (legacy uses it for
        // EndDate) but deliberately dropped here — Omni's own mandate create
        // has no endsAt field at all; see OmniCreateMandateParams.startsAt's
        // doc comment. This app is always the one that decides when an Omni
        // mandate stops being debited (see the mandate-debit scheduler
        // guidance in docs/mojo-omni-app-integration-design.md).
        merchantReference: params.merchantReference,
        description: params.description,
      },
      this.credentials,
      idempotencyKey,
    );
    return {
      status: result.mandateStatus,
      providerReference: result.mandateId,
      merchantReference: result.merchantReference,
      raw: result.raw,
    };
  }

  async cancelMandate(
    params: GatewayCancelMandateParams,
    idempotencyKey: string,
  ): Promise<GatewayMandateResult> {
    if (!params.providerReference) {
      throw new Error('OmniMojoPayAdapter.cancelMandate requires providerReference (the Omni mandateId).');
    }
    const result = await this.mandate.cancelMandate(
      params.providerReference,
      { mobile: params.mobile, reason: params.reason },
      this.credentials,
      idempotencyKey,
    );
    return {
      status: result.mandateStatus,
      providerReference: result.mandateId,
      merchantReference: result.merchantReference,
      raw: result.raw,
    };
  }

  async debitMandate(
    params: GatewayMandateDebitParams,
    idempotencyKey: string,
  ): Promise<GatewayPaymentResult> {
    const result = await this.mandate.createMandateDebit(
      params.mandateReference,
      {
        amount: params.amount,
        currency: params.currency,
        merchantReference: params.merchantReference,
        provider: params.provider,
      },
      this.credentials,
      idempotencyKey,
    );
    return {
      status: result.paymentStatus,
      providerReference: result.mandateId,
      merchantReference: result.merchantReference,
      amount: result.amount,
      raw: result.raw,
    };
  }

  async getMandateStatus(reference: GatewayReference): Promise<GatewayMandateResult> {
    const result = await this.mandate.getMandateByReference(reference.merchantReference, this.credentials);
    return {
      status: result.mandateStatus,
      providerReference: result.mandateId,
      merchantReference: result.merchantReference,
      raw: result.raw,
    };
  }

  listSubscriptionPlans(): Promise<OmniSubscriptionPlan[]> {
    return this.mandate.listSubscriptionPlans(this.credentials);
  }

  createSubscription(
    params: OmniCreateSubscriptionParams,
    idempotencyKey: string,
  ): Promise<OmniSubscription> {
    return this.mandate.createSubscription(params, this.credentials, idempotencyKey);
  }

  getSubscription(merchantReference: string): Promise<OmniSubscription> {
    return this.mandate.getSubscriptionByReference(merchantReference, this.credentials);
  }

  verifyMobileNumber(params: { mobile: string; provider?: string }): Promise<OmniVerificationResult> {
    return this.verification.verifyMsisdn(params, this.credentials);
  }

  verifyBankAccount(params: {
    bankCode: string;
    accountNumber: string;
  }): Promise<OmniVerificationResult> {
    return this.verification.verifyBankAccount(params, this.credentials);
  }

  getBanks(): Promise<Record<string, unknown>> {
    return this.verification.getBanks(this.credentials);
  }

  getMobileProviders(): Promise<Record<string, unknown>> {
    return this.verification.getMobileProviders(this.credentials);
  }

  getAccountContext(): Promise<OmniAccountContext> {
    return this.verification.getAccountContext(this.credentials);
  }

  getBalance(params?: { currency?: string }): Promise<OmniBalance> {
    return this.balance.getBalance(params, this.credentials);
  }

  createPayout(params: OmniCreatePayoutParams, idempotencyKey: string): Promise<OmniPayout> {
    return this.payout.createPayout(params, this.credentials, idempotencyKey);
  }

  getPayoutStatus(merchantReference: string): Promise<OmniPayout> {
    return this.payout.getPayoutByReference(merchantReference, this.credentials);
  }
}
