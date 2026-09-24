import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { SMSProvider } from './SMSProvider';

export interface DeywuroConfig {
  apiUrl: string;
  username: string;
  password: string;
  source: string;
}

interface DeywuroSendSMSResponse {
  code: number;
  message?: string;
}

export class DeywuroIntegration implements SMSProvider {
  private readonly apiUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly source: string;
  private readonly timeout: number = 30000;

  constructor(config: DeywuroConfig) {
    this.apiUrl = config.apiUrl;
    this.username = config.username;
    this.password = config.password;
    this.source = config.source;

    if (!this.apiUrl || !this.username || !this.password || !this.source) {
      throw new Error(
        'Deywuro configuration incomplete. Required: DEYWURO_API_URL, DEYWURO_USERNAME, DEYWURO_PASSWORD, DEYWURO_SOURCE',
      );
    }
  }

  async sendSMS(
    destination: string,
    message: string,
  ): Promise<{ messageId: string }> {
    const payload = {
      username: this.username,
      password: this.password,
      source: this.source,
      destination,
      message,
    };

    const data = await fetchWithTimeout<DeywuroSendSMSResponse>(
      this.apiUrl + '/sms',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      this.timeout,
    );

    if (data.code === 0) {
      return { messageId: data.message ?? '' };
    }

    const errorMessages: Record<number, string> = {
      401: 'Invalid credentials',
      402: 'Missing required fields',
      403: 'Insufficient balance',
      404: 'Not routable - invalid phone number',
    };

    const errorMsg = errorMessages[data.code] ?? `Error - ${data.message}`;
    console.error(`Deywuro: ${errorMsg}`);
    throw new Error(
      data.code === 404
        ? 'Invalid phone number. Please check and try again.'
        : 'Failed to send SMS. Please try again.',
    );
  }
}
