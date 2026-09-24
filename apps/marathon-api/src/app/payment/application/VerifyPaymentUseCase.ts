import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { ErrorCode, PaymentStatus } from '@marathon/core';
import { db } from '@marathon-api/core';
import {
  MojoCollectionIntegration,
  QueueService,
} from '@marathon-api/integration';

export type VerifyPaymentParams = { transactionId: string };
export type VerifyPaymentResult = { status: PaymentStatus };

@Injectable()
export class VerifyPaymentUseCase {
  constructor(private mojo: MojoCollectionIntegration) {}

  async execute(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const payment = await db.payment.findUnique({
      where: { transactionId: params.transactionId },
    });
    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
        ErrorCode.PAYMENT_NOT_FOUND,
      );
    }
    if (payment.status !== 'pending') {
      return { status: payment.status };
    }

    const { response, paymentStatus } = await this.mojo.queryStatusWithConfig(
      params.transactionId,
    );
    if (paymentStatus === 'pending') return { status: 'pending' };

    const committed = await db.$transaction(async (tx) => {
      const updated = await tx.payment.updateMany({
        where: { id: payment.id, status: 'pending' },
        data: {
          status: paymentStatus,
          invoicePayload: response as any,
          reason: response.remarks,
          confirmedAt: paymentStatus === 'completed' ? new Date() : null,
          requiresAttention: paymentStatus === 'failed',
        },
      });
      // participant follows payment
      await tx.participant.updateMany({
        where: { paymentId: payment.id },
        data: {
          status: paymentStatus === 'completed' ? 'active' : 'suspended',
        },
      });
      return updated.count === 1;
    });

    if (paymentStatus === 'completed' && committed) {
      try {
        await QueueService.addNotificationJob({
          type: 'package-purchase',
          paymentId: payment.id,
          providers: ['email', 'sms'],
        });
      } catch (e) {
        console.error('Failed to enqueue package-purchase notification', e);
      }
    }

    return { status: paymentStatus };
  }
}
