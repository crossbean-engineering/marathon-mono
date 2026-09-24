
import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { BaseCoupon, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { CouponInclude, mapCoupon } from './lib';

export type GetCouponUseCaseParams = {
  id: string;
};

@Injectable()
export class GetCouponUseCase {
  async execute(params: GetCouponUseCaseParams): Promise<BaseCoupon> {
    const row = await db.coupon.findUnique({
      where: { id: params.id },
      include: CouponInclude,
    });

    if (!row) {
      throw new NotFoundException('Coupon not found', ErrorCode.COUPON_NOT_FOUND);
    }

    return mapCoupon(row);
  }
}
