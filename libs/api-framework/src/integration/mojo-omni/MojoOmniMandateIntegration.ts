import {
  MojoOmniHttpClient,
  MojoOmniClientConfig,
  requireIdempotencyKey,
} from './MojoOmniHttpClient';
import { toOmniAmount, normalizeAmountFields, parseMoneyField } from './amounts';
import { mapToMandateStatus, mapToPaymentStatus } from './status';
import { optionalString } from './parse';
import {
  MojoOmniConfig,
  OmniCancelMandateParams,
  OmniCreateMandateDebitParams,
  OmniCreateMandateParams,
  OmniCreateSubscriptionParams,
  OmniMandate,
  OmniMandateDebit,
  OmniMandateFrequency,
  OmniSubscription,
  OmniSubscriptionPlan,
} from './types';

export function toOmniMandate(raw: Record<string, unknown>): OmniMandate {
  const status = optionalString(raw['status']);
  return {
    mandateId: optionalString(raw['mandate_id']) ?? optionalString(raw['id']),
    status,
    mandateStatus: mapToMandateStatus(status),
    merchantReference: optionalString(raw['merchant_reference']),
    raw,
  };
}

export function toOmniMandateDebit(
  raw: Record<string, unknown>,
): OmniMandateDebit {
  const status = optionalString(raw['status']);
  return {
    mandateId: optionalString(raw['mandate_id']),
    merchantReference: optionalString(raw['merchant_reference']),
    status,
    paymentStatus: mapToPaymentStatus(status),
    amount: normalizeAmountFields(raw).amount,
    currency: optionalString(raw['currency']),
    raw,
  };
}

export function toOmniSubscription(
  raw: Record<string, unknown>,
): OmniSubscription {
  return {
    subscriptionId: optionalString(raw['subscription_id']),
    status: optionalString(raw['status']),
    merchantReference: optionalString(raw['merchant_reference']),
    planId: optionalString(raw['plan_id']),
    mandateId: optionalString(raw['mandate_id']),
    raw,
  };
}

export function toOmniSubscriptionPlan(
  raw: Record<string, unknown>,
): OmniSubscriptionPlan {
  const durationMonths = raw['duration_months'];
  const frequency = optionalString(raw['frequency']);

  return {
    planId: optionalString(raw['plan_id']) ?? '',
    name: optionalString(raw['name']) ?? '',
    description: optionalString(raw['description']),
    currency: optionalString(raw['currency']),
    // Left undefined rather than defaulted to 0 — a plan whose price we could
    // not read must not render as free.
    amount: parseMoneyField(raw['amount'], 'amount'),
    frequency: isMandateFrequency(frequency) ? frequency : undefined,
    durationType: optionalString(raw['duration_type']),
    durationMonths: typeof durationMonths === 'number' ? durationMonths : null,
    status: optionalString(raw['status']),
    raw,
  };
}

function isMandateFrequency(
  value: string | undefined,
): value is OmniMandateFrequency {
  return value === 'DAILY' || value === 'WEEKLY' || value === 'MONTHLY';
}

export class MojoOmniMandateIntegration {
  private readonly http: MojoOmniHttpClient;

  constructor(config: MojoOmniClientConfig) {
    this.http = new MojoOmniHttpClient(config);
  }

  async createMandate(
    params: OmniCreateMandateParams,
    config: MojoOmniConfig,
    idempotencyKey: string,
  ): Promise<OmniMandate> {
    requireIdempotencyKey(idempotencyKey);

    if (params.planId && (!params.customerName || !params.customerEmail)) {
      throw new Error(
        'customerName and customerEmail are required when planId is set.',
      );
    }

    const raw = await this.http.request<Record<string, unknown>>(
      'POST',
      '/v1/mandates',
      {
        config,
        idempotencyKey,
        body: {
          mobile: params.mobile,
          provider: params.provider,
          currency: params.currency,
          amount: toOmniAmount(params.amount),
          frequency: params.frequency,
          starts_at: params.startsAt,
          merchant_reference: params.merchantReference,
          description: params.description,
          plan_id: params.planId,
          customer_name: params.customerName,
          customer_email: params.customerEmail,
          notes: params.notes,
        },
      },
    );

    return toOmniMandate(raw);
  }

  async getMandateByReference(
    merchantReference: string,
    config: MojoOmniConfig,
  ): Promise<OmniMandate> {
    const raw = await this.http.request<Record<string, unknown>>(
      'GET',
      '/v1/mandates',
      { config, query: { merchant_reference: merchantReference } },
    );
    return toOmniMandate(raw);
  }

  async cancelMandate(
    mandateId: string,
    params: OmniCancelMandateParams,
    config: MojoOmniConfig,
    idempotencyKey: string,
  ): Promise<OmniMandate> {
    requireIdempotencyKey(idempotencyKey);

    const raw = await this.http.request<Record<string, unknown>>(
      'POST',
      `/v1/mandates/${encodeURIComponent(mandateId)}/cancel`,
      {
        config,
        idempotencyKey,
        body: { mobile: params.mobile, reason: params.reason },
      },
    );

    return toOmniMandate(raw);
  }

  async createMandateDebit(
    mandateId: string,
    params: OmniCreateMandateDebitParams,
    config: MojoOmniConfig,
    idempotencyKey: string,
  ): Promise<OmniMandateDebit> {
    requireIdempotencyKey(idempotencyKey);

    const raw = await this.http.request<Record<string, unknown>>(
      'POST',
      `/v1/mandates/${encodeURIComponent(mandateId)}/debits`,
      {
        config,
        idempotencyKey,
        body: {
          amount: toOmniAmount(params.amount),
          currency: params.currency,
          merchant_reference: params.merchantReference,
          provider: params.provider,
        },
      },
    );

    return toOmniMandateDebit(raw);
  }

  async getMandateDebitStatus(
    params: { mandateId: string; merchantReference: string },
    config: MojoOmniConfig,
  ): Promise<OmniMandateDebit> {
    const raw = await this.http.request<Record<string, unknown>>(
      'GET',
      '/v1/mandate_debits/status',
      {
        config,
        query: {
          mandate_id: params.mandateId,
          merchant_reference: params.merchantReference,
        },
      },
    );
    return toOmniMandateDebit(raw);
  }

  /**
   * Requires the subscriptions product to be enabled for the merchant; the API
   * answers 403 otherwise. Unwraps the { object: 'list', data: [...] } envelope.
   */
  async listSubscriptionPlans(
    config: MojoOmniConfig,
  ): Promise<OmniSubscriptionPlan[]> {
    const response = await this.http.request<{
      data?: Record<string, unknown>[];
    }>('GET', '/v1/subscription_plans', { config });

    return (response.data ?? []).map(toOmniSubscriptionPlan);
  }

  async createSubscription(
    params: OmniCreateSubscriptionParams,
    config: MojoOmniConfig,
    idempotencyKey: string,
  ): Promise<OmniSubscription> {
    requireIdempotencyKey(idempotencyKey);

    const raw = await this.http.request<Record<string, unknown>>(
      'POST',
      '/v1/subscriptions',
      {
        config,
        idempotencyKey,
        body: {
          plan_id: params.planId,
          merchant_reference: params.merchantReference,
          customer_name: params.customerName,
          customer_email: params.customerEmail,
          mobile: params.mobile,
          provider: params.provider,
          notes: params.notes,
        },
      },
    );

    return toOmniSubscription(raw);
  }

  async getSubscriptionByReference(
    merchantReference: string,
    config: MojoOmniConfig,
  ): Promise<OmniSubscription> {
    const raw = await this.http.request<Record<string, unknown>>(
      'GET',
      '/v1/subscriptions',
      { config, query: { merchant_reference: merchantReference } },
    );
    return toOmniSubscription(raw);
  }
}
