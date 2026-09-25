import { Injectable } from '@rabstack/rab-api';
import fs from 'fs';
import path from 'path';
import {
  EmailTemplateName,
  EmailTemplateData,
  TextRenderer,
  AccountSetupData,
  PackagePurchaseData,
} from './types';

@Injectable()
export class EmailTemplateService {
  private templatesDir: string;

  /**
   * Plaintext fallbacks. TypeScript enforces one entry per template name.
   */
  private readonly textRenderers: TextRenderer = {
    'account-setup': (data: AccountSetupData) =>
      `Hello ${data.firstName}, welcome to Western City Run! Your account is ready.`,

    'package-purchase': (data: PackagePurchaseData) =>
      `Hello ${data.participantName}, your ${data.packageName} package purchase is confirmed. ` +
      `Weekend Package: ${data.weekendPackage}. ` +
      `Amount: ${data.currency} ${data.amount}. Race code: ${data.code}. ` +
      `Transaction ID: ${data.transactionId}. Date: ${data.date}. ` +
      `Check in on event day: ${data.checkinUrl}`,
  };

  constructor() {
    // Templates are copied by webpack to <bundle-root>/email-templates
    // (see webpack.config.js assets). __dirname is the bundle root at runtime.
    this.templatesDir = path.join(__dirname, 'email-templates');
  }

  async render<T extends EmailTemplateName>(
    templateName: T,
    data: EmailTemplateData<T>,
  ): Promise<string> {
    const templatePath = path.join(this.templatesDir, `${templateName}.html`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    let template = fs.readFileSync(templatePath, 'utf-8');

    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      template = template.replace(regex, String((data as any)[key]));
    });

    return template;
  }

  renderText<T extends EmailTemplateName>(
    templateName: T,
    data: EmailTemplateData<T>,
  ): string {
    const renderer = this.textRenderers[templateName];
    return renderer(data as any);
  }
}
