import {
  MojoOmniHttpClient,
  MojoOmniClientConfig,
  requireIdempotencyKey,
} from './MojoOmniHttpClient';
import { toOmniAmount, normalizeAmountFields } from './amounts';
import { mapToPaymentStatus } from './status';
import { optionalString, nullableString } from './parse';
import {
  MojoOmniConfig,
  OmniAmountMode,
  OmniCheckoutSession,
  OmniCheckoutSessionCreate,
  OmniCreateCheckoutSessionParams,
  OmniPaymentRail,
} from './types';

export function toOmniCheckoutSession(
  raw: Record<string, unknown>,
): OmniCheckoutSession {
  const status = optionalString(raw['status']);
  return {
    ...normalizeAmountFields(raw),
    id: optionalString(raw['id']) ?? '',
    status,
    paymentStatus: mapToPaymentStatus(status),
    currency: optionalString(raw['currency']),
    amountMode: optionalString(raw['amount_mode']) as OmniAmountMode | undefined,
    merchantReference: optionalString(raw['merchant_reference']),
    mobile: nullableString(raw['mobile']),
    paymentRail: nullableString(raw['payment_rail']) as
      | OmniPaymentRail
      | null
      | undefined,
    provider: nullableString(raw['provider']),
    cardScheme: nullableString(raw['card_scheme']),
    raw,
  };
}

function toOmniCheckoutSessionCreate(
  raw: Record<string, unknown>,
): OmniCheckoutSessionCreate {
  const id = optionalString(raw['id']);
  const url = optionalString(raw['url']);

  // The API declares id, status, url and expires_at required on a create.
  // Defaulting a missing url to '' would send the payer to an empty redirect
  // and look like a working session, so fail here instead.
  if (!id || !url) {
    throw new Error(
      `MojoPay Omni returned a checkout session without ${!id ? 'an id' : 'a url'}. Received keys: ${Object.keys(raw).join(', ') || '(none)'}`,
    );
  }

  return {
    ...normalizeAmountFields(raw),
    id,
    status: optionalString(raw['status']) ?? '',
    url,
    expiresAt: optionalString(raw['expires_at']) ?? '',
    currency: optionalString(raw['currency']),
    amountMode: optionalString(raw['amount_mode']) as OmniAmountMode | undefined,
    raw,
  };
}

export class MojoOmniCheckoutIntegration {
  private readonly http: MojoOmniHttpClient;

  constructor(config: MojoOmniClientConfig) {
    this.http = new MojoOmniHttpClient(config);
  }

  async createCheckoutSession(
    params: OmniCreateCheckoutSessionParams,
    config: MojoOmniConfig,
    idempotencyKey: string,
  ): Promise<OmniCheckoutSessionCreate> {
    requireIdempotencyKey(idempotencyKey);

    const amountMode: OmniAmountMode = params.amountMode ?? 'fixed';

    if (amountMode === 'fixed' && params.amount === undefined) {
      throw new Error(
        "amount is required when amountMode is 'fixed' (the default).",
      );
    }
    if (amountMode === 'open' && params.amount !== undefined) {
      throw new Error(
        "amount must be omitted when amountMode is 'open' — the customer enters it on the hosted page.",
      );
    }

    const raw = await this.http.request<Record<string, unknown>>(
      'POST',
      '/v1/checkout/sessions',
      {
        config,
        idempotencyKey,
        body: {
          amount_mode: amountMode,
          amount:
            params.amount === undefined ? undefined : toOmniAmount(params.amount),
          currency: params.currency,
          merchant_reference: params.merchantReference,
          success_url: params.successUrl,
          cancel_url: params.cancelUrl,
          payment_rail: params.paymentRail,
          mobile: params.mobile,
          provider: params.provider,
          description: params.description,
        },
      },
    );

    return toOmniCheckoutSessionCreate(raw);
  }

  async getCheckoutSession(
    id: string,
    config: MojoOmniConfig,
  ): Promise<OmniCheckoutSession> {
    const raw = await this.http.request<Record<string, unknown>>(
      'GET',
      `/v1/checkout/sessions/${encodeURIComponent(id)}`,
      { config },
    );
    return toOmniCheckoutSession(raw);
  }
}
