import { Put, RabApiPut } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { UpdateAddOnUseCase } from '../application';

type ControllerT = ApiSpec<'updateAddOn'>;

@Put(MarathonApis.updateAddOn, {
  permission: AppAccess.canManageCatalog,
  bodySchema: Joi.object({
    name: Joi.string().trim().optional(),
    provider: Joi.string().trim().allow(null).optional(),
    description: Joi.string().allow(null).optional(),
    occupancy: Joi.number().integer().min(1).allow(null).optional(),
    price: Joi.number().integer().min(0).optional(),
    capacity: Joi.number().integer().min(1).allow(null).optional(),
    isActive: Joi.boolean().optional(),
  }),
})
export class UpdateAddOn implements RabApiPut<ControllerT> {
  constructor(private useCase: UpdateAddOnUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({
      id: request.params.id,
      payload: request.body,
    });
  };
}
