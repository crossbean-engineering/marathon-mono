import { SMSProvider } from './SMSProvider';

export interface HubtelConfig {
  clientId: string;
  clientSecret: string;
  /** Sender ID shown to the recipient (max 11 alphanumeric chars, e.g. "MojoPay"). */
  from: string;
  baseUrl?: string;
}

interface HubtelSendResponse {
  status?: number;
  messageId?: string;
  rate?: number;
  networkId?: string;
  clientReference?: string;
  message?: string;
}

const HUBTEL_BASE_URL = 'https://smsc.hubtel.com/v1';

/**
 * Hubtel SMS (Ghana). Credentials travel as query params on the send URL, so the
 * request URL is never logged as-is — only a redacted form.
 */
export class HubtelIntegration implements SMSProvider {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly from: string;
  private readonly timeout: number = 30000;

  constructor(config: HubtelConfig) {
    this.baseUrl = (config.baseUrl || HUBTEL_BASE_URL).replace(/\/$/, '');
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.from = config.from;

    if (!this.clientId || !this.clientSecret || !this.from) {
      throw new Error(
        'Hubtel configuration incomplete. Required: HUBTEL_CLIENT_ID, HUBTEL_CLIENT_SECRET, HUBTEL_FROM',
      );
    }
  }

  async sendSMS(
    destination: string,
    message: string,
  ): Promise<{ messageId: string }> {
    // Hubtel expects the MSISDN in international format without the leading '+'.
    const to = destination.replace(/^\+/, '');

    const url = new URL(`${this.baseUrl}/messages/send`);
    url.searchParams.set('clientsecret', this.clientSecret);
    url.searchParams.set('clientid', this.clientId);
    url.searchParams.set('from', this.from);
    url.searchParams.set('to', to);
    url.searchParams.set('content', message);

    const safeUrl = `${this.baseUrl}/messages/send?from=${this.from}&to=${to}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      const data = (await response
        .json()
        .catch(() => ({}))) as HubtelSendResponse;

      if (!response.ok) {
        console.error('Hubtel SMS request failed:', {
          url: safeUrl,
          httpStatus: response.status,
          status: data.status,
          message: data.message,
        });
        throw new Error('Failed to send SMS. Please try again.');
      }

      // Hubtel returns status 0 when the message is accepted for delivery.
      if (Number(data.status) !== 0) {
        console.error('Hubtel message rejected:', {
          url: safeUrl,
          status: data.status,
          message: data.message,
        });
        throw new Error('Failed to send SMS. Please try again.');
      }

      return { messageId: data.messageId ?? '' };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Hubtel SMS request timeout:', safeUrl);
        throw new Error('Failed to send SMS. Please try again.');
      }
      if (error instanceof Error && error.message.includes('SMS')) {
        throw error;
      }
      console.error('Hubtel SMS sending error:', error);
      throw new Error('Failed to send SMS. Please try again.');
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
