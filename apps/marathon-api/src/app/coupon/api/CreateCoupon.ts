import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { CreateCouponUseCase } from '../application';

type ControllerT = ApiSpec<'createCoupon'>;

@Post(MarathonApis.createCoupon, {
  permission: AppAccess.canManageCatalog,
  bodySchema: Joi.object({
    percentOff: Joi.number().integer().min(1).max(100).required(),
    isActive: Joi.boolean().optional(),
    packageIds: Joi.array().items(Joi.string()).min(1).required(),
  }),
})
export class CreateCoupon implements RabApiPost<ControllerT> {
  constructor(private useCase: CreateCouponUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ payload: request.body });
  };
}
