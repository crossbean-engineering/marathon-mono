import * as nodemailer from 'nodemailer';

export interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  defaultFrom?: string;
}

export interface SMTPSendEmailRequest {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text: string;
  replyTo?: string;
}

export interface SMTPSendEmailResponse {
  id: string;
}

export function formatSenderName(
  appName: string,
  address?: string,
): string | undefined {
  return address ? `${appName} <${address}>` : undefined;
}

export class SMTPIntegration {
  private transporter: nodemailer.Transporter;
  private readonly defaultFrom: string;

  constructor(config: SMTPConfig) {
    this.defaultFrom = config.defaultFrom || config.user;

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.user,
        pass: config.password,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
    });
  }

  async sendEmail(
    request: SMTPSendEmailRequest,
  ): Promise<SMTPSendEmailResponse> {
    const { to, subject, html, text, from, replyTo } = request;

    if (!to || !subject) {
      throw new Error('Email "to" and "subject" are required');
    }

    if (!html && !text) {
      throw new Error('Either "html" or "text" content is required');
    }

    try {
      const info = await this.transporter.sendMail({
        from: from || this.defaultFrom,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text,
        html,
        replyTo,
      });

      return { id: info.messageId };
    } catch (error) {
      console.error('Email sending failed via SMTP:', error);
      throw new Error('Failed to send email. Please try again later.');
    }
  }
}
