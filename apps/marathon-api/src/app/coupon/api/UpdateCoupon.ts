import { Put, RabApiPut } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { UpdateCouponUseCase } from '../application';

type ControllerT = ApiSpec<'updateCoupon'>;

@Put(MarathonApis.updateCoupon, {
  permission: AppAccess.canManageCatalog,
  bodySchema: Joi.object({
    percentOff: Joi.number().integer().min(1).max(100).optional(),
    isActive: Joi.boolean().optional(),
    packageIds: Joi.array().items(Joi.string()).min(1).optional(),
  }),
})
export class UpdateCoupon implements RabApiPut<ControllerT> {
  constructor(private useCase: UpdateCouponUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({
      id: request.params.id,
      payload: request.body,
    });
  };
}
