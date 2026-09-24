import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';

export type DeleteCouponUseCaseParams = {
  id: string;
};

@Injectable()
export class DeleteCouponUseCase {
  async execute(params: DeleteCouponUseCaseParams): Promise<{ success: true }> {
    const existing = await db.coupon.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Coupon not found', ErrorCode.COUPON_NOT_FOUND);
    }

    // Historical payments keep their coupon snapshot; the FK is set null.
    await db.coupon.delete({ where: { id: params.id } });

    return { success: true };
  }
}
