import { Prisma } from '@marathon-api/prisma';
import { BaseCoupon } from '@marathon/core';
import { PackageSummarySelect } from '../../participant/application/lib';

// A coupon with its linked packages (scalar summary fields only).
export const CouponInclude = {
  packages: { select: PackageSummarySelect },
} satisfies Prisma.CouponInclude;

export type CouponFromDB = Prisma.CouponGetPayload<{
  include: typeof CouponInclude;
}>;

export function mapCoupon(row: CouponFromDB): BaseCoupon {
  return {
    id: row.id,
    code: row.code,
    percentOff: row.percentOff,
    isActive: row.isActive,
    packages: row.packages.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      benefits: p.benefits,
    })),
    createdAt: row.createdAt.toISOString(),
  };
}

// Percentage discount math. All values are integer pesewas.
export function computeDiscount(
  originalAmount: number,
  percentOff: number,
): { discountAmount: number; netAmount: number } {
  const discountAmount = Math.round((originalAmount * percentOff) / 100);
  return { discountAmount, netAmount: originalAmount - discountAmount };
}
