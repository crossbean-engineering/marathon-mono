import {
  MojoPayConfig,
  CollectionInitPaymentRequest,
  CollectionInitPaymentResponse,
  CollectionStatusResponse,
  CollectionCallbackPayload,
  CollectionStatusCodes,
  PaymentStatus,
} from './types';
import { PaymentEnv, getPaymentServiceUrls } from '../../utils/payment-url';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

export type MojoCollectionConfig = {
  environment: PaymentEnv;
};

export class MojoCollectionIntegration {
  private readonly baseUrl: string;
  private readonly timeout: number = 30000;

  constructor(config: MojoCollectionConfig) {
    this.baseUrl = getPaymentServiceUrls('mojopay', config.environment).collectionBaseUrl;
  }

  private authHeader(config: MojoPayConfig): string {
    return 'Basic ' + Buffer.from(`${config.appId}:${config.apiKey}`).toString('base64');
  }

  async initPayment(
    request: CollectionInitPaymentRequest,
    config: MojoPayConfig,
  ): Promise<CollectionInitPaymentResponse> {
    const url = `${this.baseUrl}/api/payments/initpayment`;

    const data = await fetchWithTimeout<CollectionInitPaymentResponse>(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader(config),
        },
        body: JSON.stringify(request),
      },
      this.timeout,
    );

    console.log('[MojoCollection] initPayment response:', JSON.stringify(data));

    if (data.statusCode !== 'CL-00-REQUEST-SUBMITTED') {
      throw new Error(`Collection payment initiation failed: ${data.statusCode} - ${data.statusMessage}`);
    }

    return data;
  }

  async queryStatus(
    orderId: string,
    config: MojoPayConfig,
  ): Promise<{ response: CollectionStatusResponse; paymentStatus: PaymentStatus }> {
    const url = `${this.baseUrl}/api/payments/status/${encodeURIComponent(orderId)}`;

    const response = await fetchWithTimeout<CollectionStatusResponse>(
      url,
      {
        method: 'GET',
        headers: { Authorization: this.authHeader(config) },
      },
      this.timeout,
    );

    return { response, paymentStatus: this.mapToPaymentStatus(response.statusCode) };
  }

  mapToPaymentStatus(statusCode: string): PaymentStatus {
    if (statusCode === CollectionStatusCodes.SUCCESS) return 'completed';
    if (
      statusCode === CollectionStatusCodes.FAILED ||
      statusCode === CollectionStatusCodes.CANCELLED ||
      statusCode === CollectionStatusCodes.EXPIRED
    )
      return 'failed';
    return 'pending';
  }

  mapCallbackToPaymentStatus(payload: CollectionCallbackPayload): PaymentStatus {
    return this.mapToPaymentStatus(payload.statusCode);
  }
}