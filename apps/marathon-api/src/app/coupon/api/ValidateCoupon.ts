import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { ApplyCouponUseCase } from '../application';

type ControllerT = ApiSpec<'validateCoupon'>;

@Post(MarathonApis.validateCoupon, {
  permission: AppAccess.canBuyPackage,
  bodySchema: Joi.object({
    code: Joi.string().trim().required(),
    packageId: Joi.string().required(),
  }),
})
export class ValidateCoupon implements RabApiPost<ControllerT> {
  constructor(private useCase: ApplyCouponUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    const result = await this.useCase.execute({
      code: request.body.code,
      packageId: request.body.packageId,
    });
    return {
      code: result.couponCode,
      percentOff: result.percentOff,
      originalAmount: result.originalAmount,
      discountAmount: result.discountAmount,
      netAmount: result.netAmount,
    };
  };
}
