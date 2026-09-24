import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@rabstack/rab-api';
import { ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { computeDiscount } from './lib';

export type ApplyCouponInput = {
  code: string;
  packageId: string;
};

export type ApplyCouponResult = {
  couponId: string;
  couponCode: string;
  percentOff: number;
  originalAmount: number;
  discountAmount: number;
  netAmount: number;
};

// Single source of coupon validation + pricing, shared by the validateCoupon
// endpoint and BuyPackageUseCase. Read-only — performs no writes.
@Injectable()
export class ApplyCouponUseCase {
  async execute(params: ApplyCouponInput): Promise<ApplyCouponResult> {
    const code = params.code.trim().toUpperCase();

    const pkg = await db.package.findUnique({
      where: { id: params.packageId },
      select: { price: true },
    });
    if (!pkg) {
      throw new NotFoundException(
        'Package not found',
        ErrorCode.PACKAGE_NOT_FOUND,
      );
    }

    const coupon = await db.coupon.findUnique({
      where: { code },
      include: { packages: { select: { id: true } } },
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found', ErrorCode.COUPON_NOT_FOUND);
    }
    if (!coupon.isActive) {
      throw new BadRequestException(
        'Coupon is not active',
        undefined,
        ErrorCode.COUPON_INACTIVE,
      );
    }
    if (!coupon.packages.some((p) => p.id === params.packageId)) {
      throw new BadRequestException(
        'Coupon does not apply to this package',
        undefined,
        ErrorCode.COUPON_NOT_APPLICABLE,
      );
    }

    const { discountAmount, netAmount } = computeDiscount(
      pkg.price,
      coupon.percentOff,
    );

    return {
      couponId: coupon.id,
      couponCode: coupon.code,
      percentOff: coupon.percentOff,
      originalAmount: pkg.price,
      discountAmount,
      netAmount,
    };
  }
}
