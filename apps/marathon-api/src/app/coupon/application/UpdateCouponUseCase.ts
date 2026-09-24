import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { BaseCoupon, ErrorCode, UpdateCouponBody } from '@marathon/core';
import { db } from '@marathon-api/core';
import { CouponInclude, mapCoupon } from './lib';

export type UpdateCouponUseCaseParams = {
  id: string;
  payload: UpdateCouponBody;
};

@Injectable()
export class UpdateCouponUseCase {
  async execute(params: UpdateCouponUseCaseParams): Promise<BaseCoupon> {
    const { id, payload } = params;

    // Resolve + run all preconditions before the write. `code` is immutable.
    const existing = await db.coupon.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Coupon not found', ErrorCode.COUPON_NOT_FOUND);
    }

    if (payload.packageIds) {
      await this.assertPackagesExist(payload.packageIds);
    }

    const updated = await db.coupon.update({
      where: { id },
      data: {
        percentOff: payload.percentOff,
        isActive: payload.isActive,
        packages: payload.packageIds
          ? { set: payload.packageIds.map((pid) => ({ id: pid })) }
          : undefined,
      },
      include: CouponInclude,
    });

    return mapCoupon(updated);
  }

  private async assertPackagesExist(packageIds: string[]): Promise<void> {
    const found = await db.package.count({
      where: { id: { in: packageIds } },
    });
    if (found !== new Set(packageIds).size) {
      throw new NotFoundException(
        'One or more packages not found',
        ErrorCode.PACKAGE_NOT_FOUND,
      );
    }
  }
}
