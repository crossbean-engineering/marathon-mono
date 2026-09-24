import { MojoOmniHttpClient, MojoOmniClientConfig } from './MojoOmniHttpClient';
import { parseMoneyField } from './amounts';
import { optionalString } from './parse';
import { MojoOmniConfig } from './types';

export type OmniBalance = {
  currency: string;
  /** Pesewas. */
  available: number;
  /** Pesewas. Available after T+1 settlement. */
  collectionWallet?: number;
  collectionWalletActual?: number;
  collectionWalletHeld?: number;
  payoutWallet?: number;
  pending?: number;
  providerFloat?: number;
  raw: Record<string, unknown>;
};

/**
 * GET /v1/balance. Read-only, no idempotency key.
 *
 * Omits X-Mojo-Account-Ref: balance is a merchant-global figure, exempted from
 * sub-account scoping the same way /v1/metadata/* is — see the exemption noted
 * on MojoOmniRequestOptions.omitAccountRef.
 */
export class MojoOmniBalanceIntegration {
  private readonly client: MojoOmniHttpClient;

  constructor(config: MojoOmniClientConfig) {
    this.client = new MojoOmniHttpClient(config);
  }

  async getBalance(
    params: { currency?: string } | undefined,
    config: MojoOmniConfig,
  ): Promise<OmniBalance> {
    const raw = await this.client.request<Record<string, unknown>>('GET', '/v1/balance', {
      config,
      query: { currency: params?.currency },
      omitAccountRef: true,
    });

    return {
      currency: optionalString(raw['currency']) ?? '',
      available: parseMoneyField(raw['available'], 'available') ?? 0,
      collectionWallet: parseMoneyField(raw['collection_wallet'], 'collection_wallet'),
      collectionWalletActual: parseMoneyField(
        raw['collection_wallet_actual'],
        'collection_wallet_actual',
      ),
      collectionWalletHeld: parseMoneyField(
        raw['collection_wallet_held'],
        'collection_wallet_held',
      ),
      payoutWallet: parseMoneyField(raw['payout_wallet'], 'payout_wallet'),
      pending: parseMoneyField(raw['pending'], 'pending'),
      providerFloat: parseMoneyField(raw['provider_float'], 'provider_float'),
      raw,
    };
  }
}
