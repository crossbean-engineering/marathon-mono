import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { CreateAddOnUseCase } from '../application';

type ControllerT = ApiSpec<'createAddOn'>;

@Post(MarathonApis.createAddOn, {
  permission: AppAccess.canManageCatalog,
  bodySchema: Joi.object({
    type: Joi.string().valid('accommodation', 'transport').required(),
    name: Joi.string().trim().required(),
    provider: Joi.string().trim().optional(),
    description: Joi.string().optional(),
    // People sharing the room — required for accommodation.
    occupancy: Joi.number().integer().min(1).when('type', {
      is: 'accommodation',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    price: Joi.number().integer().min(0).required(), // pesewas, per person
    capacity: Joi.number().integer().min(1).optional(),
    isActive: Joi.boolean().optional(),
  }),
})
export class CreateAddOn implements RabApiPost<ControllerT> {
  constructor(private useCase: CreateAddOnUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ payload: request.body });
  };
}
