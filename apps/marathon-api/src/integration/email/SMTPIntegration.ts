import { Injectable } from '@rabstack/rab-api';
import { SMTPIntegration as BaseSMTPIntegration } from '@api/framework';
import { MarathonApiMeta } from '@marathon-api/core';

export type {
  SMTPSendEmailRequest,
  SMTPSendEmailResponse,
  SMTPConfig,
} from '@api/framework';

@Injectable()
export class SMTPIntegration extends BaseSMTPIntegration {
  constructor() {
    super({
      host: MarathonApiMeta.smtp.host,
      port: MarathonApiMeta.smtp.port,
      user: MarathonApiMeta.smtp.user,
      password: MarathonApiMeta.smtp.password,
      defaultFrom: MarathonApiMeta.smtp.from || undefined,
    });
  }
}
