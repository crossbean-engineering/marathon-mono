import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { BaseCoupon, CreateCouponBody, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { generateCouponCode } from '@marathon-api/lib';
import { CouponInclude, mapCoupon } from './lib';

export type CreateCouponUseCaseParams = {
  payload: CreateCouponBody;
};

@Injectable()
export class CreateCouponUseCase {
  async execute(params: CreateCouponUseCaseParams): Promise<BaseCoupon> {
    const { percentOff, isActive, packageIds } = params.payload;

    await this.assertPackagesExist(packageIds);

    const code = await this.generateUniqueCode();

    const row = await db.coupon.create({
      data: {
        code,
        percentOff,
        isActive: isActive ?? true,
        packages: { connect: packageIds.map((id) => ({ id })) },
      },
      include: CouponInclude,
    });

    return mapCoupon(row);
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

  // Generate a code, regenerating on the rare collision with an existing one.
  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCouponCode();
      const taken = await db.coupon.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!taken) return code;
    }
    // Astronomically unlikely; widen the code to defuse the collision.
    return generateCouponCode(10);
  }
}
