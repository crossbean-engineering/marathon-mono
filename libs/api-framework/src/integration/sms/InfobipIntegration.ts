import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { SMSProvider } from './SMSProvider';

export interface InfobipConfig {
  baseUrl: string;
  apiKey: string;
  sender?: string;
}

interface InfobipMessage {
  sender?: string;
  destinations: { to: string }[];
  content: { text: string };
}

interface InfobipMessageStatus {
  groupId: number;
  groupName: string;
  id: number;
  name: string;
  description: string;
}

interface InfobipSendResponse {
  bulkId: string;
  messages: {
    to: string;
    status: InfobipMessageStatus;
    messageId: string;
  }[];
}

export class InfobipIntegration implements SMSProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly sender?: string;
  private readonly timeout: number = 30000;

  constructor(config: InfobipConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.sender = config.sender;

    if (!this.baseUrl || !this.apiKey) {
      throw new Error(
        'Infobip configuration incomplete. Required: INFOBIP_BASE_URL, INFOBIP_API_KEY',
      );
    }
  }

  async sendSMS(
    destination: string,
    message: string,
  ): Promise<{ messageId: string }> {
    const msg: InfobipMessage = {
      destinations: [{ to: destination }],
      content: { text: message },
      ...(this.sender && { sender: this.sender }),
    };

    try {
      const data = await fetchWithTimeout<InfobipSendResponse>(
        `${this.baseUrl}/sms/3/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `App ${this.apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ messages: [msg] }),
        },
        this.timeout,
      );

      const sent = data.messages?.[0];
      if (!sent) {
        throw new Error('Infobip returned no message results');
      }

      const groupName = sent.status?.groupName;
      if (groupName === 'REJECTED' || groupName === 'UNDELIVERABLE') {
        console.error('Infobip message rejected:', sent.status);
        throw new Error('Failed to send SMS. Please try again.');
      }

      return { messageId: sent.messageId };
    } catch (error) {
      if (error instanceof Error && error.message.includes('SMS')) {
        throw error;
      }
      console.error('Infobip SMS sending error:', error);
      throw new Error('Failed to send SMS. Please try again.');
    }
  }
}
