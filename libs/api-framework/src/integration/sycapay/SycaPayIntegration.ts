import {
  SycaPayConfig,
  SycaPayAuthRequest,
  SycaPayAuthResponse,
  SycaPayPaymentRequest,
  SycaPayPaymentResponse,
  SycaPayStatusResponse,
  SycaPayInitiateInput,
  SycaPayInitiateOutput,
  SycaPayStatusCodes,
} from './types';
import type { PaymentStatus, PaymentMethod } from '../mojopay/types';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import {getPaymentServiceUrls, PaymentEnv} from "../../utils/payment-url";

export type SycaPayIntegrationConfig = {
  environment: PaymentEnv;
};

export class SycaPayIntegration {
  private readonly baseUrl: string;
  private readonly timeout: number = 30000;

  constructor(config: SycaPayIntegrationConfig) {
    const urls = getPaymentServiceUrls('sycapay', config.environment);
    this.baseUrl = urls.baseUrl;
  }

  async getInvoice(transactionId: string): Promise<{
    invoice: SycaPayStatusResponse;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
  }> {
    const invoice = await this.queryPaymentStatus(transactionId);
    const paymentStatus = this.mapToPaymentStatus(invoice);
    const paymentMethod = this.mapPaymentMethod(invoice.operator);

    return { invoice, paymentStatus, paymentMethod };
  }

  async authenticate(
    amount: number,
    currency: string,
    config: SycaPayConfig,
  ): Promise<string> {
    const payload: SycaPayAuthRequest = {
      montant: amount.toString(),
      currency: currency,
    };

    const url = `${this.baseUrl}/login.php`;
    const data = await fetchWithTimeout<SycaPayAuthResponse>(
      url,
      {
        method: 'POST',
        headers: this.getAuthHeaders(config),
        body: JSON.stringify(payload),
      },
      this.timeout,
    );

    if (data.code !== 0) {
      throw new Error(`SycaPay authentication failed: ${data.desc}`);
    }

    return data.token;
  }

  async initiatePayment(
    input: SycaPayInitiateInput,
    config: SycaPayConfig,
  ): Promise<SycaPayInitiateOutput> {
    const token = await this.authenticate(input.amount, input.currency, config);

    const payload: SycaPayPaymentRequest = {
      marchandid: config.merchantId,
      token: token,
      telephone: input.phoneNumber,
      name: input.customerName,
      montant: input.amount.toString(),
      currency: input.currency,
      numcommande: input.orderId,
      pays: 'CI',
      operateurs: input.operator,
    };

    const url = `${this.baseUrl}/mcheckoutpay.php`;
    const data = await fetchWithTimeout<SycaPayPaymentResponse>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      this.timeout,
    );

    if (data.code < 0 && data.code !== SycaPayStatusCodes.PENDING) {
      console.error(JSON.stringify(data));
      throw new Error(
        `Payment initiation failed: ${data.message || data.description}`,
      );
    }

    return {
      orderId: input.orderId,
      providerTransactionId: data.transactionId,
      redirectUrl: data.url,
      request: payload,
      response: data,
    };
  }

  async queryPaymentStatus(
    transactionId: string,
  ): Promise<SycaPayStatusResponse> {
    const url = `${this.baseUrl}/GetStatus.php`;
    return await fetchWithTimeout<SycaPayStatusResponse>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: transactionId }),
      },
      this.timeout,
    );
  }

  mapToPaymentStatus(statusResponse: SycaPayStatusResponse): PaymentStatus {
    if (statusResponse.code === SycaPayStatusCodes.SUCCESS) {
      return 'completed';
    }
    if (statusResponse.code === SycaPayStatusCodes.PENDING) {
      return 'pending';
    }
    return 'failed';
  }

  mapPaymentMethod(operator?: string): PaymentMethod {
    return 'momo';
  }

  private getAuthHeaders(config: SycaPayConfig): Record<string, string> {
    return {
      'X-SYCA-MERCHANDID': config.merchantId,
      'X-SYCA-APIKEY': config.apiKey,
      'X-SYCA-REQUEST-DATA-FORMAT': 'JSON',
      'X-SYCA-RESPONSE-DATA-FORMAT': 'JSON',
      'Content-Type': 'application/json',
    };
  }
}
