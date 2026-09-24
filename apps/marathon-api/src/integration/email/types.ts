/**
 * Template type safety: every template name maps to a data interface, and the
 * TextRenderer map forces a plaintext version to exist for each one.
 */

export type EmailTemplateName = 'account-setup' | 'package-purchase';

export interface AccountSetupData {
  firstName: string;
}

export interface PackagePurchaseData {
  participantName: string;
  packageName: string;
  amount: string; // formatted GHS, e.g. "150.00"
  currency: string;
  transactionId: string;
  date: string;
  code: string; // participant race code
  checkinUrl: string; // {webAppUrl}/checkin/{code}
  qrDataUrl: string; // base64 PNG data URI of checkinUrl
}

export type EmailTemplateData<T extends EmailTemplateName> =
  T extends 'account-setup'
    ? AccountSetupData
    : T extends 'package-purchase'
      ? PackagePurchaseData
      : never;

/**
 * Type guard ensuring every template name has a plaintext renderer.
 */
export type TextRenderer = {
  [K in EmailTemplateName]: (data: EmailTemplateData<K>) => string;
};
