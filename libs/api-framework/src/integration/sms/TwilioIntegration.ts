import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { SMSProvider } from './SMSProvider';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  /** Twilio phone number or alphanumeric sender ID. Required unless messagingServiceSid is set. */
  from?: string;
  /** Messaging Service SID. Alternative to `from`. */
  messagingServiceSid?: string;
  baseUrl?: string;
}

interface TwilioSendResponse {
  sid: string;
  status: string;
  error_code: number | null;
  error_message: string | null;
}

const TWILIO_BASE_URL = 'https://api.twilio.com/2010-04-01';

export class TwilioIntegration implements SMSProvider {
  private readonly baseUrl: string;
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly from?: string;
  private readonly messagingServiceSid?: string;
  private readonly timeout: number = 30000;

  constructor(config: TwilioConfig) {
    this.baseUrl = (config.baseUrl || TWILIO_BASE_URL).replace(/\/$/, '');
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.from = config.from;
    this.messagingServiceSid = config.messagingServiceSid;

    if (!this.accountSid || !this.authToken) {
      throw new Error(
        'Twilio configuration incomplete. Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN',
      );
    }

    if (!this.from && !this.messagingServiceSid) {
      throw new Error(
        'Twilio configuration incomplete. Required: TWILIO_FROM or TWILIO_MESSAGING_SERVICE_SID',
      );
    }
  }

  async sendSMS(
    destination: string,
    message: string,
  ): Promise<{ messageId: string }> {
    const body = new URLSearchParams({
      To: destination,
      Body: message,
      ...(this.messagingServiceSid
        ? { MessagingServiceSid: this.messagingServiceSid }
        : { From: this.from as string }),
    });

    const credentials = Buffer.from(
      `${this.accountSid}:${this.authToken}`,
    ).toString('base64');

    try {
      const data = await fetchWithTimeout<TwilioSendResponse>(
        `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: body.toString(),
        },
        this.timeout,
      );

      if (data.status === 'failed' || data.status === 'undelivered') {
        console.error('Twilio message rejected:', {
          status: data.status,
          errorCode: data.error_code,
          errorMessage: data.error_message,
        });
        throw new Error('Failed to send SMS. Please try again.');
      }

      return { messageId: data.sid };
    } catch (error) {
      if (error instanceof Error && error.message.includes('SMS')) {
        throw error;
      }
      console.error('Twilio SMS sending error:', error);
      throw new Error('Failed to send SMS. Please try again.');
    }
  }
}
