import { Injectable } from '@rabstack/rab-api';
import { BaseCoupon } from '@marathon/core';
import { db } from '@marathon-api/core';
import { CouponInclude, mapCoupon } from './lib';

@Injectable()
export class ListCouponsUseCase {
  async execute(): Promise<BaseCoupon[]> {
    const rows = await db.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: CouponInclude,
    });

    return rows.map(mapCoupon);
  }
}
