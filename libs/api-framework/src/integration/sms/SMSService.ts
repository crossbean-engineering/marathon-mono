import { SMSProvider } from './SMSProvider';

export class SMSService {
  constructor(private readonly provider: SMSProvider) {}

  async send(
    destination: string,
    message: string,
  ): Promise<{ messageId: string }> {
    if (!destination || !message) {
      throw new Error('SMS "destination" and "message" are required');
    }

    const sanitizedPhone = this.sanitizePhoneNumber(destination);
    return this.provider.sendSMS(sanitizedPhone, message);
  }

  private sanitizePhoneNumber(phoneNumber: string): string {
    let sanitized = phoneNumber.replace(/[^\d+]/g, '');
    if (!sanitized.startsWith('+')) {
      sanitized = '+' + sanitized;
    }
    return sanitized;
  }
}
