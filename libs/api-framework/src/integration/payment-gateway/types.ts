import { PaymentStatus, MandateStatus } from '../mojopay/types';
import {
  OmniSubscriptionPlan,
  OmniCreateSubscriptionParams,
  OmniSubscription,
  OmniVerificationResult,
  OmniBalance,
  OmniCreatePayoutParams,
  OmniPayout,
  OmniAccountContext,
} from '../mojo-omni';

export type PaymentGatewayProvider = 'legacy' | 'omni';

export type GatewayCapability =
  | 'collectPayment'
  | 'hostedCheckout'
  | 'mandates'
  | 'subscriptions'
  | 'verifications'
  | 'balance'
  | 'payouts'
  | 'subAccounts';

// === Shared tier: both generations implement these ===

export type GatewayCollectPaymentParams = {
  /** Pesewas. */
  amount: number;
  currency: string;
  mobile: string;
  /** Telco code, e.g. 'MTN' | 'VODAFONE' | 'AIRTELTIGO'. */
  provider: string;
  merchantReference: string;
  description?: string;
};

export type GatewayPaymentResult = {
  status: PaymentStatus;
  /** Legacy: transactionId. Omni: collection id. */
  providerReference?: string;
  merchantReference?: string;
  /** Pesewas. */
  amount?: number;
  /** Untouched underlying response — debugging/audit only. Never branch app logic on this. */
  raw: unknown;
};

export type GatewayHostedCheckoutParams = {
  /** Pesewas. Required for legacy and for Omni's 'fixed' mode; omit for Omni 'open' mode. */
  amount?: number;
  currency: string;
  merchantReference: string;
  /** Legacy: return_url. Omni: success_url. */
  successUrl: string;
  /** Omni-only concept; ignored by the legacy adapter. */
  cancelUrl?: string;
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
  description?: string;
};

export type GatewayHostedCheckoutResult = {
  redirectUrl: string;
  /** Legacy: Token. Omni: checkout session id. */
  providerReference: string;
  raw: unknown;
};

export type GatewayReference = {
  merchantReference: string;
  /**
   * Required for legacy mandate cancel/status (keyed on MandateId, not
   * merchantReference) and for Omni hosted-checkout status (checkout sessions
   * are looked up by id, with no reference-based lookup in the built client).
   */
  providerReference?: string;
};

export type GatewayCreateMandateParams = {
  mobile: string;
  provider: string;
  /** Pesewas. */
  amount: number;
  currency: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  /** ISO 8601. Legacy adapter derives StartDate/EndDate from this pair. */
  startsAt: string;
  endsAt: string;
  merchantReference: string;
  description?: string;
};

export type GatewayMandateResult = {
  status: MandateStatus;
  /** Legacy: MandateId. Omni: mandateId. */
  providerReference?: string;
  merchantReference?: string;
  raw: unknown;
};

export type GatewayCancelMandateParams = GatewayReference & {
  mobile: string;
  reason: string;
};

export type GatewayMandateDebitParams = {
  /** The mandate's providerReference, as returned by createMandate. */
  mandateReference: string;
  merchantReference: string;
  /** Pesewas. */
  amount: number;
  currency: string;
  provider: string;
};

/**
 * One interface, two generations. The shared tier (money-in, mandates) has
 * generation-neutral Gateway* request/response types. The Omni-only tier
 * returns Omni's own Omni* types directly — inventing a parallel "neutral"
 * type for a capability with exactly one implementation would be ceremony
 * with no payoff. See docs/mojo-omni-app-integration-design.md.
 */
export interface PaymentGatewayFacade {
  readonly provider: PaymentGatewayProvider;

  // --- Shared tier ---
  collectPayment(
    params: GatewayCollectPaymentParams,
    idempotencyKey: string,
  ): Promise<GatewayPaymentResult>;
  getPaymentStatus(reference: GatewayReference): Promise<GatewayPaymentResult>;

  initiateHostedCheckout(
    params: GatewayHostedCheckoutParams,
    idempotencyKey: string,
  ): Promise<GatewayHostedCheckoutResult>;
  getHostedCheckoutStatus(reference: GatewayReference): Promise<GatewayPaymentResult>;

  createMandate(
    params: GatewayCreateMandateParams,
    idempotencyKey: string,
  ): Promise<GatewayMandateResult>;
  cancelMandate(
    params: GatewayCancelMandateParams,
    idempotencyKey: string,
  ): Promise<GatewayMandateResult>;
  debitMandate(
    params: GatewayMandateDebitParams,
    idempotencyKey: string,
  ): Promise<GatewayPaymentResult>;
  getMandateStatus(reference: GatewayReference): Promise<GatewayMandateResult>;

  // --- Omni-only tier: legacy throws GatewayCapabilityNotSupportedError ---
  listSubscriptionPlans(): Promise<OmniSubscriptionPlan[]>;
  createSubscription(
    params: OmniCreateSubscriptionParams,
    idempotencyKey: string,
  ): Promise<OmniSubscription>;
  getSubscription(merchantReference: string): Promise<OmniSubscription>;
  verifyMobileNumber(params: { mobile: string; provider?: string }): Promise<OmniVerificationResult>;
  verifyBankAccount(params: {
    bankCode: string;
    accountNumber: string;
  }): Promise<OmniVerificationResult>;
  getBanks(): Promise<Record<string, unknown>>;
  getMobileProviders(): Promise<Record<string, unknown>>;
  getBalance(params?: { currency?: string }): Promise<OmniBalance>;
  createPayout(params: OmniCreatePayoutParams, idempotencyKey: string): Promise<OmniPayout>;
  getPayoutStatus(merchantReference: string): Promise<OmniPayout>;
  getAccountContext(): Promise<OmniAccountContext>;

  /** Feature-detection, so callers branch without needing a try/catch. */
  supports(capability: GatewayCapability): boolean;
}
