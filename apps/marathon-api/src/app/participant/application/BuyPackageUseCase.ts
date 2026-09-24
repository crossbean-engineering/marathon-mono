import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@rabstack/rab-api';
import { BuyPackageBody, BuyPackageResponse, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { generateTransactionId } from '@marathon-api/lib';
import { QueueService } from '@marathon-api/integration';
import { PaymentProcessor } from '@marathon-api/app/payment';
import { ApplyCouponUseCase } from '@marathon-api/app/coupon';
import { mapParticipant } from './lib';
import {
  resolveNewParticipant,
  resolveExistingParticipant,
} from './purchaseContext';

export type BuyPackageUseCaseParams = {
  payload: BuyPackageBody;
  userId: string;
};

@Injectable()
export class BuyPackageUseCase {
  constructor(
    private processor: PaymentProcessor,
    private applyCoupon: ApplyCouponUseCase,
  ) {}

  async execute(params: BuyPackageUseCaseParams): Promise<BuyPackageResponse> {
    const { participant, participantId, payment } = params.payload;

    const user = await db.user.findUnique({ where: { id: params.userId } });
    if (!user) {
      throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND);
    }

    // Resolve context + run all preconditions BEFORE any write.
    const ctx = participantId
      ? await resolveExistingParticipant(
          participantId,
          params.userId,
          params.payload.packageId,
        )
      : await resolveNewParticipant(params.payload);

    // Apply a promo code (if supplied) before charging. Validated against the
    // resolved package; throws on invalid/inactive/not-applicable coupons.
    if (params.payload.couponCode) {
      const applied = await this.applyCoupon.execute({
        code: params.payload.couponCode,
        packageId: ctx.packageId,
      });
      ctx.originalPrice = ctx.price;
      ctx.price = applied.netAmount;
      ctx.discountAmount = applied.discountAmount;
      ctx.couponId = applied.couponId;
      ctx.couponCode = applied.couponCode;
    }

    // A coupon covering the whole price leaves nothing to charge, and Mojo
    // rejects a zero-amount collection — which would strand the participant on
    // `pending`. Those registrations are settled by ClaimFreePackageUseCase.
    if (ctx.price === 0) {
      throw new BadRequestException(
        'This coupon covers the full package price — use /participants/claim instead',
        undefined,
        ErrorCode.COUPON_NOT_APPLICABLE,
      );
    }

    // charge via Mojo collection
    const processed = await this.processor.execute({
      amount: ctx.price,
      currency: 'GHS',
      mobile: payment.momoNumber,
      network: payment.network,
      email: payment.email,
      customerName: ctx.customerName,
      orderDescription: `Package: ${ctx.packageName}`,
    });

    const result = await db.$transaction(async (tx) => {
      const paymentRow = await tx.payment.create({
        data: {
          amount: ctx.price,
          currency: 'GHS',
          status: 'pending',
          provider: 'mojopay',
          gateway: 'MojoCollection',
          orderId: processed.orderId,
          transactionId: processed.transactionId,
          momoNumber: payment.momoNumber,
          network: payment.network,
          paymentMethod: 'momo',
          email: payment.email,
          originalAmount: ctx.originalPrice,
          discountAmount: ctx.discountAmount,
          couponCode: ctx.couponCode,
          couponId: ctx.couponId,
          performedBy: params.userId,
          requestPayload: processed.request as any,
          responsePayload: processed.response as any,
        },
      });

      // Retry: relink the existing participant to the fresh payment and reset
      // it to pending. New: create the participant linked to the payment.
      const participantRow = ctx.existingParticipantId
        ? await tx.participant.update({
            where: { id: ctx.existingParticipantId },
            // switchPackageId is undefined unless switching → Prisma ignores it
            data: {
              paymentId: paymentRow.id,
              status: 'pending',
              packageId: ctx.switchPackageId,
            },
          })
        : await tx.participant.create({
            data: {
              name: participant!.name,
              ic: participant!.ic,
              shirtSize: participant!.shirtSize,
              gender: participant!.gender,
              code: generateTransactionId(),
              status: 'pending',
              userId: params.userId,
              packageId: ctx.packageId,
              paymentId: paymentRow.id,
            },
          });

      return { paymentRow, participantRow };
    });

    // enqueue verification (never fail the purchase on redis error)
    try {
      await QueueService.addPaymentVerification({
        paymentId: result.paymentRow.id,
        transactionId: result.paymentRow.transactionId,
        createdAt: new Date(),
      });
    } catch (e) {
      console.error('Failed to enqueue payment verification', e);
    }

    return {
      participant: mapParticipant(result.participantRow),
      payment: {
        orderId: result.paymentRow.orderId,
        transactionId: result.paymentRow.transactionId,
        status: 'pending',
        originalAmount: ctx.originalPrice,
        discountAmount: ctx.discountAmount,
      },
    };
  }
}
