import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@rabstack/rab-api';
import crypto from 'crypto';
import {
  ClaimFreePackageBody,
  ClaimFreePackageResponse,
  ErrorCode,
} from '@marathon/core';
import { db } from '@marathon-api/core';
import { generateTransactionId } from '@marathon-api/lib';
import { QueueService } from '@marathon-api/integration';
import { ApplyCouponUseCase } from '@marathon-api/app/coupon';
import { resolvePurchaseAddOns } from '@marathon-api/app/addOn';
import { mapParticipant } from './lib';
import {
  resolveNewParticipant,
  resolveExistingParticipant,
} from './purchaseContext';

export type ClaimFreePackageUseCaseParams = {
  payload: ClaimFreePackageBody;
  userId: string;
};

// Settles a registration whose coupon covers the entire package price. Nothing
// is charged, so the payment gateway is never involved: the settlement is
// recorded as a `waived` payment of 0 carrying the coupon snapshot, and the
// participant is active immediately.
@Injectable()
export class ClaimFreePackageUseCase {
  constructor(private applyCoupon: ApplyCouponUseCase) {}

  async execute(
    params: ClaimFreePackageUseCaseParams,
  ): Promise<ClaimFreePackageResponse> {
    const { payload, userId } = params;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND);
    }

    // Resolve context + run all preconditions BEFORE any write.
    const ctx = payload.participantId
      ? await resolveExistingParticipant(
          payload.participantId,
          userId,
          payload.packageId,
        )
      : await resolveNewParticipant(payload);

    const applied = await this.applyCoupon.execute({
      code: payload.couponCode,
      packageId: ctx.packageId,
    });

    // This endpoint settles without collecting anything, so it only accepts a
    // coupon that zeroes the price. A partial discount still owes a balance and
    // must go through /participants/buy.
    if (applied.netAmount !== 0) {
      throw new BadRequestException(
        'Coupon does not cover the full package price — use /participants/buy instead',
        undefined,
        ErrorCode.COUPON_NOT_APPLICABLE,
      );
    }

    // Coupons cover the race package only. A retried participant with paid
    // Weekend Package add-ons still owes for them, so goes through buy.
    const addOns = await resolvePurchaseAddOns(
      undefined,
      ctx.existingParticipantId,
    );
    if (addOns.total > 0) {
      throw new BadRequestException(
        'Weekend Package add-ons still need payment — use /participants/buy instead',
        undefined,
        ErrorCode.COUPON_NOT_APPLICABLE,
      );
    }

    const result = await db.$transaction(async (tx) => {
      const paymentRow = await tx.payment.create({
        data: {
          amount: 0,
          currency: 'GHS',
          // Nothing to confirm later — this settles on creation.
          status: 'completed',
          paymentMethod: 'waived',
          provider: 'coupon',
          gateway: 'FullDiscount',
          // No provider transaction backs a waived settlement, but both columns
          // are unique and non-null — mint them the way a charge does.
          orderId: generateTransactionId(),
          transactionId: crypto.randomBytes(16).toString('hex'),
          // momoNumber/network stay null: no payment channel was used.
          email: user.email,
          originalAmount: applied.originalAmount,
          discountAmount: applied.discountAmount,
          couponCode: applied.couponCode,
          couponId: applied.couponId,
          performedBy: userId,
          confirmedAt: new Date(),
        },
      });

      // Claiming an existing participant relinks it to this settlement; a new
      // one is created against it. Either way it is active straight away.
      const participantRow = ctx.existingParticipantId
        ? await tx.participant.update({
            where: { id: ctx.existingParticipantId },
            // switchPackageId is undefined unless switching → Prisma ignores it
            data: {
              paymentId: paymentRow.id,
              status: 'active',
              packageId: ctx.switchPackageId,
            },
          })
        : await tx.participant.create({
            data: {
              name: payload.participant!.name,
              ic: payload.participant!.ic,
              shirtSize: payload.participant!.shirtSize,
              gender: payload.participant!.gender,
              code: generateTransactionId(),
              status: 'active',
              userId,
              packageId: ctx.packageId,
              paymentId: paymentRow.id,
            },
          });

      return { paymentRow, participantRow };
    });

    // Already settled, so send the confirmation the payment verifier would
    // otherwise send. Never fail the claim on a redis error.
    try {
      await QueueService.addNotificationJob({
        type: 'package-purchase',
        paymentId: result.paymentRow.id,
        providers: ['email', 'sms'],
      });
    } catch (e) {
      console.error('Failed to enqueue package-purchase notification', e);
    }

    return {
      participant: mapParticipant(result.participantRow),
      payment: {
        orderId: result.paymentRow.orderId,
        transactionId: result.paymentRow.transactionId,
        status: 'completed',
        originalAmount: applied.originalAmount,
        discountAmount: applied.discountAmount,
      },
    };
  }
}