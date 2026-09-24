import { OmniAmounts } from './amounts';
import { OmniPaymentStatus } from './status';
import { PaymentStatus, MandateStatus } from '../mojopay/types';

// === Client / credentials ===

export type MojoOmniConfig = {
  clientId: string;
  clientSecret: string;
  /** Sent as X-Mojo-Account-Ref when sub-accounts are enabled for the merchant. */
  accountRef?: string;
};

// === Shared enums ===

export type OmniAmountMode = 'fixed' | 'open';
export type OmniPaymentRail = 'mobile_money' | 'card';
export type OmniMandateFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

// === Collections ===

export type OmniCreateCollectionParams = {
  /** Integer pesewas. */
  amount: number;
  currency: string;
  merchantReference: string;
  mobile: string;
  provider: string;
  description?: string;
};

export type OmniCollection = OmniAmounts & {
  id?: string;
  status?: OmniPaymentStatus;
  paymentStatus: PaymentStatus;
  merchantReference?: string;
  currency?: string;
  raw: Record<string, unknown>;
};

// === Checkout ===

export type OmniCreateCheckoutSessionParams = {
  currency: string;
  merchantReference: string;
  successUrl: string;
  cancelUrl: string;
  /** Defaults to 'fixed'. 'open' is rejected by the API while in Testing mode. */
  amountMode?: OmniAmountMode;
  /** Integer pesewas. Required when amountMode is 'fixed' or omitted. */
  amount?: number;
  paymentRail?: OmniPaymentRail | null;
  mobile?: string;
  provider?: string;
  description?: string;
};

export type OmniCheckoutSessionCreate = OmniAmounts & {
  id: string;
  status: string;
  url: string;
  expiresAt: string;
  currency?: string;
  amountMode?: OmniAmountMode;
  raw: Record<string, unknown>;
};

export type OmniCheckoutSession = OmniAmounts & {
  id: string;
  status?: string;
  paymentStatus: PaymentStatus;
  currency?: string;
  amountMode?: OmniAmountMode;
  merchantReference?: string;
  mobile?: string | null;
  paymentRail?: OmniPaymentRail | null;
  provider?: string | null;
  cardScheme?: string | null;
  raw: Record<string, unknown>;
};

// === Mandates ===

export type OmniCreateMandateParams = {
  mobile: string;
  provider: string;
  currency: string;
  /** Integer pesewas. */
  amount: number;
  frequency: OmniMandateFrequency;
  /**
   * ISO 8601 date-time. Sets the upstream mandate's start and day-of-debit
   * (derived from this plus `frequency`). Omni does not accept an end date —
   * confirmed against the live API reference (omni.mojo-pay.com/doc#87) —
   * so there is deliberately no `endsAt` field here; the calling app is
   * always the one that decides when a mandate stops being debited.
   */
  startsAt: string;
  merchantReference: string;
  description?: string;
  /** When set, links the mandate to a subscription plan. Requires customerName and customerEmail. */
  planId?: string;
  customerName?: string;
  customerEmail?: string;
  notes?: string;
};

export type OmniCancelMandateParams = {
  mobile: string;
  reason: string;
};

export type OmniCreateMandateDebitParams = {
  /** Integer pesewas. */
  amount: number;
  currency: string;
  merchantReference: string;
  provider: string;
};

/**
 * The OpenAPI spec types mandate responses as bare `additionalProperties: true`
 * with no documented fields, so the typed surface is best-effort and `raw`
 * carries everything else.
 */
export type OmniMandate = {
  mandateId?: string;
  status?: string;
  mandateStatus: MandateStatus;
  merchantReference?: string;
  raw: Record<string, unknown>;
};

export type OmniMandateDebit = {
  mandateId?: string;
  merchantReference?: string;
  status?: string;
  paymentStatus: PaymentStatus;
  /** Integer pesewas. */
  amount?: number;
  currency?: string;
  raw: Record<string, unknown>;
};

// === Subscriptions ===

export type OmniSubscriptionPlan = {
  planId: string;
  name: string;
  description?: string;
  currency?: string;
  /** Integer pesewas. Undefined when the API did not quote a readable amount. */
  amount?: number;
  /** Undefined when the API sent a frequency this client does not recognise. */
  frequency?: OmniMandateFrequency;
  durationType?: string;
  durationMonths?: number | null;
  status?: string;
  raw: Record<string, unknown>;
};

export type OmniCreateSubscriptionParams = {
  planId: string;
  merchantReference: string;
  customerName: string;
  customerEmail: string;
  mobile: string;
  provider: string;
  notes?: string;
};

export type OmniSubscription = {
  subscriptionId?: string;
  status?: string;
  merchantReference?: string;
  planId?: string;
  mandateId?: string;
  raw: Record<string, unknown>;
};

// === Verifications / account ===

export type OmniVerificationResult = {
  status: 'verified' | 'invalid';
  profile?: { firstName?: string; lastName?: string } | null;
  raw: Record<string, unknown>;
};

export type OmniAccountContext = {
  merchant: { id?: number; name?: string; subAccountsEnabled?: boolean };
  account?: {
    id: string;
    accountRef: string;
    name?: string;
    status?: string;
  } | null;
  raw: Record<string, unknown>;
};
