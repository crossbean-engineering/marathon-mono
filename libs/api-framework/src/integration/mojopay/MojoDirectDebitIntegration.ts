import {
  MojoPayConfig,
  DDAuthResponse,
  CreateMandateRequest,
  CreateMandateResponse,
  MandateStatusResponse,
  CancelMandateRequest,
  CancelMandateResponse,
  DDPaymentStatusRequest,
  DDPaymentStatusResponse,
  MandateStatus,
  PaymentStatus,
} from './types';
import { PaymentEnv, getPaymentServiceUrls } from '../../utils/payment-url';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

export type MojoDirectDebitConfig = {
  environment: PaymentEnv;
};

export class MandateNotFoundError extends Error {
  constructor(public readonly merchantReferenceId: string) {
    super(`Mandate not found on MojoPay: ${merchantReferenceId}`);
    this.name = 'MandateNotFoundError';
  }
}

export class MojoDirectDebitIntegration {
  private readonly baseUrl: string;
  private readonly timeout: number = 30000;
  private tokenCache = new Map<string, { token: string; expiresAt: number }>();

  constructor(config: MojoDirectDebitConfig) {
    this.baseUrl = getPaymentServiceUrls(
      'mojopay',
      config.environment,
    ).directDebitBaseUrl;
  }

  async authenticate(config: MojoPayConfig): Promise<string> {
    const appId = config.ddAppId || config.appId;
    const appKey = config.ddAppKey || config.apiKey;
    const cacheKey = appId;

    const cached = this.tokenCache.get(cacheKey);
    if (cached && Date.now() / 1000 < cached.expiresAt - 60) {
      return cached.token;
    }

    const url = `${this.baseUrl}/api/auth/token`;
    const data = await fetchWithTimeout<DDAuthResponse>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ AppId: appId, AppKey: appKey }),
    });

    if (data.Status !== 'success') {
      throw new Error(`DD auth failed: ${data.Message}`);
    }

    this.tokenCache.set(cacheKey, {
      token: data.AccessToken,
      expiresAt: data.ExpiresAt,
    });
    return data.AccessToken;
  }

  async createMandate(
    params: Omit<
      CreateMandateRequest,
      'FeeType' | 'Country' | 'PlatformScheduling'
    >,
    config: MojoPayConfig,
  ): Promise<CreateMandateResponse> {
    const token = await this.authenticate(config);
    const url = `${this.baseUrl}/api/mandate/create-mandate`;

    const payload: CreateMandateRequest = {
      ...params,
      FeeType: 'DIRECTDEBIT',
      Country: 'GHA',
      PlatformScheduling: true,
    };

    const data = await fetchWithTimeout<CreateMandateResponse>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (data.StatusCode !== 'DD_ACCEPTED') {
      throw new Error(`Create mandate failed: ${data.StatusMessage}`);
    }

    return data;
  }

  async getMandateStatus(
    merchantReferenceId: string,
    config: MojoPayConfig,
  ): Promise<{
    response: MandateStatusResponse;
    mandateStatus: MandateStatus;
  }> {
    let response: MandateStatusResponse;
    try {
      response = await this.queryMandateStatus(merchantReferenceId, config);
    } catch (err) {
      // MojoPay returns HTTP 404 with body { StatusCode: 'DD_NOT_FOUND', StatusMessage: 'No Record Found!' }
      // for unknown mandates; fetchWithTimeout throws on non-2xx with the StatusMessage as error message.
      if (err instanceof Error && /no record found/i.test(err.message)) {
        throw new MandateNotFoundError(merchantReferenceId);
      }
      throw err;
    }
    if (
      response.StatusCode === 'DD_NOT_FOUND' ||
      response.StatusCode === 'DD_RECORD_NOT_FOUND'
    ) {
      throw new MandateNotFoundError(merchantReferenceId);
    }
    const mandateStatus = this.mapToMandateStatus(response.Status || '');
    return { response, mandateStatus };
  }

  private async queryMandateStatus(
    merchantReferenceId: string,
    config: MojoPayConfig,
  ): Promise<MandateStatusResponse> {
    const token = await this.authenticate(config);
    const url = `${this.baseUrl}/api/mandate/status?MerchantReferenceId=${encodeURIComponent(merchantReferenceId)}`;

    return await fetchWithTimeout<MandateStatusResponse>(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async cancelMandate(
    mobile: string,
    mandateId: string,
    reason: string,
    config: MojoPayConfig,
  ): Promise<CancelMandateResponse> {
    const token = await this.authenticate(config);
    const url = `${this.baseUrl}/api/mandate/cancel-mandate`;

    const payload: CancelMandateRequest = {
      Mobile: mobile,
      MandateId: mandateId,
      Reason: reason,
    };

    const data = await fetchWithTimeout<CancelMandateResponse>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (data.StatusCode !== 'DD_ACCEPTED') {
      throw new Error(`Cancel mandate failed: ${data.StatusMessage}`);
    }

    return data;
  }

  async getPaymentStatus(
    mandateId: string,
    transactionReferenceId: string,
    config: MojoPayConfig,
  ): Promise<{
    response: DDPaymentStatusResponse;
    paymentStatus: PaymentStatus;
  }> {
    const response = await this.queryPaymentStatus(
      mandateId,
      transactionReferenceId,
      config,
    );
    const paymentStatus = this.mapToPaymentStatus(response.StatusCode);
    return { response, paymentStatus };
  }

  private async queryPaymentStatus(
    mandateId: string,
    transactionReferenceId: string,
    config: MojoPayConfig,
  ): Promise<DDPaymentStatusResponse> {
    const token = await this.authenticate(config);
    const url = `${this.baseUrl}/api/DirectDebit/status`;

    const payload: DDPaymentStatusRequest = {
      MandateId: mandateId,
      TransactionReferenceId: transactionReferenceId,
    };

    return await fetchWithTimeout<DDPaymentStatusResponse>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  mapToMandateStatus(mojoStatus: string): MandateStatus {
    const status = mojoStatus.toUpperCase();
    if (status === 'APPROVED') return 'approved';
    if (status === 'REJECTED') return 'rejected';
    if (status === 'CANCELLED') return 'cancelled';
    if (status === 'EXPIRED') return 'expired';
    return 'pending';
  }

  mapToPaymentStatus(statusCode: string): PaymentStatus {
    if (statusCode === 'DD_SUCCESSFUL') return 'completed';
    if (statusCode === 'DD_FAILED' || statusCode === 'DD_CANCELLED_DECLINED')
      return 'failed';
    return 'pending';
  }
}
