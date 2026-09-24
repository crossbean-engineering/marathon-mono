export interface PaymentVerificationJob {
  paymentId: string;
  transactionId: string;
  createdAt: Date;
}

export type NotificationProvider = 'email' | 'sms';

/**
 * `providers` is optional for backwards compatibility: jobs enqueued before
 * SMS support carry no `providers` and are treated as email-only.
 */
export type NotificationJob = { providers?: NotificationProvider[] } & (
  | { type: 'account-setup'; userId: string }
  | { type: 'package-purchase'; paymentId: string }
);
