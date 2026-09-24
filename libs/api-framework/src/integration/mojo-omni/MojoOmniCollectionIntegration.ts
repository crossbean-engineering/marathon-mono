import {
  MojoOmniHttpClient,
  MojoOmniClientConfig,
  requireIdempotencyKey,
} from './MojoOmniHttpClient';
import { toOmniAmount, normalizeAmountFields } from './amounts';
import { mapToPaymentStatus, OmniPaymentStatus } from './status';
import { optionalString } from './parse';
import {
  MojoOmniConfig,
  OmniCreateCollectionParams,
  OmniCollection,
} from './types';

function isOmniPaymentStatus(
  value: string | undefined,
): value is OmniPaymentStatus {
  return value === 'processing' || value === 'succeeded' || value === 'failed';
}

export function toOmniCollection(raw: Record<string, unknown>): OmniCollection {
  const status = optionalString(raw['status']);
  return {
    ...normalizeAmountFields(raw),
    id: optionalString(raw['id']),
    // Validated rather than cast: `status` promises a three-value union, so an
    // unrecognised value stays undefined (and survives in `raw`) instead of
    // masquerading as one of the three. `paymentStatus` still maps it safely.
    status: isOmniPaymentStatus(status) ? status : undefined,
    paymentStatus: mapToPaymentStatus(status),
    merchantReference: optionalString(raw['merchant_reference']),
    currency: optionalString(raw['currency']),
    raw,
  };
}

export class MojoOmniCollectionIntegration {
  private readonly http: MojoOmniHttpClient;

  constructor(config: MojoOmniClientConfig) {
    this.http = new MojoOmniHttpClient(config);
  }

  async createCollection(
    params: OmniCreateCollectionParams,
    config: MojoOmniConfig,
    idempotencyKey: string,
  ): Promise<OmniCollection> {
    requireIdempotencyKey(idempotencyKey);

    const raw = await this.http.request<Record<string, unknown>>(
      'POST',
      '/v1/collections',
      {
        config,
        idempotencyKey,
        body: {
          amount: toOmniAmount(params.amount),
          currency: params.currency,
          merchant_reference: params.merchantReference,
          mobile: params.mobile,
          provider: params.provider,
          description: params.description,
        },
      },
    );

    return toOmniCollection(raw);
  }

  async getCollectionById(
    id: string,
    config: MojoOmniConfig,
  ): Promise<OmniCollection> {
    const raw = await this.http.request<Record<string, unknown>>(
      'GET',
      `/v1/collections/${encodeURIComponent(id)}`,
      { config },
    );
    return toOmniCollection(raw);
  }

  async getCollectionByReference(
    merchantReference: string,
    config: MojoOmniConfig,
  ): Promise<OmniCollection> {
    const raw = await this.http.request<Record<string, unknown>>(
      'GET',
      '/v1/collections',
      { config, query: { merchant_reference: merchantReference } },
    );
    return toOmniCollection(raw);
  }

  /**
   * Unified verify. Returns the raw snapshot: the API may answer with a
   * collection, a payout, or a checkout session, so there is no single shape.
   */
  async verifyTransaction(
    merchantReference: string,
    config: MojoOmniConfig,
  ): Promise<Record<string, unknown>> {
    return await this.http.request<Record<string, unknown>>(
      'GET',
      `/v1/transactions/verify/${encodeURIComponent(merchantReference)}`,
      { config },
    );
  }
}
