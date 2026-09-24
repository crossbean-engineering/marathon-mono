import Bull from 'bull';
import { db } from '@marathon-api/core';
import {
  QUEUE_CONFIG,
  PaymentVerificationJob,
} from '@marathon-api/integration';
import { VerifyPaymentUseCase } from '@marathon-api/app/payment';

export class PaymentVerificationProcessor {
  constructor(private verify: VerifyPaymentUseCase) {}

  async process(job: Bull.Job<PaymentVerificationJob>): Promise<void> {
    const { transactionId, createdAt } = job.data;
    const payment = await db.payment.findUnique({ where: { transactionId } });
    if (!payment) return;
    if (payment.status !== 'pending') return;

    const { status } = await this.verify.execute({ transactionId });
    if (status === 'completed' || status === 'failed') return;

    const ageMs = Date.now() - new Date(createdAt).getTime();
    const staleMs =
      QUEUE_CONFIG.paymentVerification.staleThresholdHours * 3_600_000;
    if (ageMs >= staleMs) {
      await db.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            requiresAttention: true,
            reason: 'Payment verification timeout',
          },
        });
        await tx.participant.updateMany({
          where: { paymentId: payment.id },
          data: { status: 'suspended' },
        });
      });
      return;
    }
    throw new Error('Payment still pending, will retry');
  }
}
