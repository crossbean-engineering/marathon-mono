import Bull from 'bull';
import { PaymentVerificationJob, NotificationJob } from './types';
import { QUEUE_NAMES, QUEUE_CONFIG, queueOptions } from './config';

export class QueueService {
  private static paymentVerificationQueue: Bull.Queue<PaymentVerificationJob>;
  private static notificationQueue: Bull.Queue<NotificationJob>;

  static initialize(): void {
    this.paymentVerificationQueue = new Bull<PaymentVerificationJob>(
      QUEUE_NAMES.PAYMENT_VERIFICATION,
      queueOptions,
    );
    this.notificationQueue = new Bull<NotificationJob>(
      QUEUE_NAMES.NOTIFICATION,
      queueOptions,
    );
  }

  static getPaymentVerificationQueue(): Bull.Queue<PaymentVerificationJob> {
    if (!this.paymentVerificationQueue) this.initialize();
    return this.paymentVerificationQueue;
  }

  static getNotificationQueue(): Bull.Queue<NotificationJob> {
    if (!this.notificationQueue) this.initialize();
    return this.notificationQueue;
  }

  static async addPaymentVerification(
    data: PaymentVerificationJob,
  ): Promise<void> {
    await this.getPaymentVerificationQueue().add(data, {
      jobId: `payment-${data.transactionId}`,
      delay: 2 * 60 * 1000,
      attempts: QUEUE_CONFIG.paymentVerification.backoffDelays.length,
      backoff: { type: 'custom' },
    });
  }

  static async addNotificationJob(data: NotificationJob): Promise<void> {
    const jobId =
      data.type === 'account-setup'
        ? `notification-account-setup-${data.userId}`
        : `notification-package-purchase-${data.paymentId}`;
    await this.getNotificationQueue().add(data, {
      jobId,
      attempts: 5,
      backoff: { type: 'exponential', delay: 30_000 },
    });
  }

  static async shutdown(): Promise<void> {
    if (this.paymentVerificationQueue)
      await this.paymentVerificationQueue.close();
    if (this.notificationQueue) await this.notificationQueue.close();
  }
}
