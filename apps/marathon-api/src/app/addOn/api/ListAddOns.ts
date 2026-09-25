import { Get, RabApiGet } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec } from '@marathon-api/shared';
import { ListAddOnsUseCase } from '../application';

type ControllerT = ApiSpec<'listAddOns'>;

// Public, like listPackages — the Weekend Package options are shown before
// login.
@Get(MarathonApis.listAddOns, {
  isProtected: false,
  querySchema: Joi.object({
    type: Joi.string().valid('accommodation', 'transport').optional(),
    activeOnly: Joi.boolean().optional(),
  }),
})
export class ListAddOns implements RabApiGet<ControllerT> {
  constructor(private useCase: ListAddOnsUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({
      type: request.query.type,
      activeOnly: request.query.activeOnly,
    });
  };
}
