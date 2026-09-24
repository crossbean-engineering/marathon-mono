import {
  MojoOmniHttpClient,
  MojoOmniClientConfig,
  requireIdempotencyKey,
} from './MojoOmniHttpClient';
import { toOmniAmount, normalizeAmountFields, parseMoneyField } from './amounts';
import { mapToPaymentStatus, OmniPaymentStatus } from './status';
import { optionalString } from './parse';
import { MojoOmniConfig } from './types';
import { PaymentStatus } from '../mojopay/types';

export type OmniCreatePayoutParams =
  | {
      type: 'mobile_money';
      /** Pesewas. */
      amount: number;
      currency: string;
      merchantReference: string;
      mobile: string;
      provider: string;
      narration?: string;
    }
  | {
      type: 'bank';
      /** Pesewas. */
      amount: number;
      currency: string;
      merchantReference: string;
      accountNumber: string;
      /** From MojoOmniVerificationIntegration.getBanks() — never hardcoded. */
      bankCode: string;
      narration?: string;
    };

export type OmniPayout = {
  id?: string;
  status?: OmniPaymentStatus;
  paymentStatus: PaymentStatus;
  merchantReference?: string;
  currency?: string;
  amount?: number;
  feeAmount?: number;
  /** Pesewas. amount + fee — what actually left the payout wallet. */
  amountDebited?: number;
  raw: Record<string, unknown>;
};

function isOmniPaymentStatus(value: string | undefined): value is OmniPaymentStatus {
  return value === 'processing' || value === 'succeeded' || value === 'failed';
}

function toOmniPayout(raw: Record<string, unknown>): OmniPayout {
  const status = optionalString(raw['status']);
  const { amount, feeAmount } = normalizeAmountFields(raw);

  return {
    id: optionalString(raw['id']),
    status: isOmniPaymentStatus(status) ? status : undefined,
    paymentStatus: mapToPaymentStatus(status),
    merchantReference: optionalString(raw['merchant_reference']),
    currency: optionalString(raw['currency']),
    amount,
    feeAmount,
    amountDebited: parseMoneyField(raw['amount_debited'], 'amount_debited'),
    raw,
  };
}

export class MojoOmniPayoutIntegration {
  private readonly http: MojoOmniHttpClient;

  constructor(config: MojoOmniClientConfig) {
    this.http = new MojoOmniHttpClient(config);
  }

  async createPayout(
    params: OmniCreatePayoutParams,
    config: MojoOmniConfig,
    idempotencyKey: string,
  ): Promise<OmniPayout> {
    requireIdempotencyKey(idempotencyKey);

    const body =
      params.type === 'mobile_money'
        ? {
            type: 'mobile_money' as const,
            amount: toOmniAmount(params.amount),
            currency: params.currency,
            merchant_reference: params.merchantReference,
            mobile: params.mobile,
            provider: params.provider,
            narration: params.narration,
          }
        : {
            type: 'bank' as const,
            amount: toOmniAmount(params.amount),
            currency: params.currency,
            merchant_reference: params.merchantReference,
            account_number: params.accountNumber,
            bank_code: params.bankCode,
            narration: params.narration,
          };

    const raw = await this.http.request<Record<string, unknown>>('POST', '/v1/payouts', {
      config,
      idempotencyKey,
      body,
    });

    return toOmniPayout(raw);
  }

  async getPayoutByReference(
    merchantReference: string,
    config: MojoOmniConfig,
  ): Promise<OmniPayout> {
    const raw = await this.http.request<Record<string, unknown>>(
      'GET',
      `/v1/payouts/${encodeURIComponent(merchantReference)}`,
      { config },
    );
    return toOmniPayout(raw);
  }
}
