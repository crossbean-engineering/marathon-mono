import { Injectable } from '@rabstack/rab-api';
import { SMTPIntegration } from './SMTPIntegration';

/**
 * Sends email via SMTP. Thin, transport-only wrapper — templating lives in
 * EmailTemplateService, orchestration in NotificationProcessor.
 */
@Injectable()
export class EmailService {
  constructor(private readonly smtp: SMTPIntegration) {}

  async send(
    to: string | string[],
    subject: string,
    text: string,
    html?: string,
  ): Promise<{ id: string }> {
    if (!to || !subject || !text) {
      throw new Error('Email "to", "subject", and "text" are required');
    }
    const response = await this.smtp.sendEmail({ to, subject, text, html });
    return { id: response.id };
  }
}
