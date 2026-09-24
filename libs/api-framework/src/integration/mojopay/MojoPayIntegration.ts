import {
  MojoPayConfig,
  MojoPayInitiatePaymentRequest,
  MojoPayInitiatePaymentResponse,
  MojoPayInvoiceStatusRequest,
  MojoPayInvoiceStatusResponse,
  MojoPayStatusMessage,
  MojoPayPaymentMode,
  InitiatePaymentResult,
  PaymentStatus,
  PaymentMethod,
} from './types';
import { PaymentEnv, getPaymentServiceUrls } from '../../utils/payment-url';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

export type MojoPayIntegrationConfig = {
  environment: PaymentEnv;
};

export class MojoPayIntegration {
  private readonly baseUrl: string;
  private readonly invoiceUrl: string;
  private readonly timeout: number = 30000;

  constructor(config: MojoPayIntegrationConfig) {
    const urls = getPaymentServiceUrls('mojopay', config.environment);
    this.baseUrl = urls.paymentApiUrl;
    this.invoiceUrl = urls.invoiceApiUrl;
  }

  async getInvoice(
    transactionId: string,
    config: MojoPayConfig,
  ): Promise<{
    invoice: MojoPayInvoiceStatusResponse;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
  }> {
    const invoice = await this.queryInvoiceStatus(transactionId, config);
    const paymentStatus = this.mapToPaymentStatus(invoice);
    const paymentMethod = this.mapPaymentMethod(invoice.payment_mode);

    return { invoice, paymentStatus, paymentMethod };
  }

  async initiatePayment(
    request: Omit<MojoPayInitiatePaymentRequest, 'app_id' | 'app_key'>,
    config: MojoPayConfig,
  ): Promise<InitiatePaymentResult> {
    const payload: MojoPayInitiatePaymentRequest = {
      app_id: config.appId,
      app_key: config.apiKey,
      ...request,
    };

    const url = `${this.baseUrl}/interapi/ProcessPayment`;
    const data = await fetchWithTimeout<MojoPayInitiatePaymentResponse>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      this.timeout,
    );

    if (data.status_code !== 1) {
      throw new Error(`Payment initiation failed: ${data.status_message}`);
    }

    return { response: data, request: payload };
  }

  async queryInvoiceStatus(
    orderId: string,
    config: MojoPayConfig,
  ): Promise<MojoPayInvoiceStatusResponse> {
    const payload: MojoPayInvoiceStatusRequest = {
      app_id: config.appId,
      app_key: config.apiKey,
      order_id: orderId,
    };

    const url = `${this.invoiceUrl}/Interapi.svc/QueryInvoiceStatus`;
    return await fetchWithTimeout<MojoPayInvoiceStatusResponse>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      this.timeout,
    );
  }

  mapToPaymentStatus(
    invoiceStatus: MojoPayInvoiceStatusResponse,
  ): PaymentStatus {
    if (
      invoiceStatus.status_code === 1 &&
      invoiceStatus.status_message === MojoPayStatusMessage.PAID_BY_CLIENT
    ) {
      return 'completed';
    } else if (
      invoiceStatus.status_code === 2 ||
      invoiceStatus.status_message === MojoPayStatusMessage.FAILED
    ) {
      return 'failed';
    }
    return 'pending';
  }

  mapPaymentMethod(paymentMode: MojoPayPaymentMode): PaymentMethod {
    if (paymentMode === MojoPayPaymentMode.MASTER) {
      return 'card';
    }
    return 'momo';
  }
}
