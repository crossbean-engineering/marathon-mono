import { Get, RabApiGet } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { ListWristbandsUseCase } from '../application';

type ControllerT = ApiSpec<'listWristbands'>;

@Get(MarathonApis.listWristbands, {
  permission: AppAccess.canManageWristbands,
  querySchema: Joi.object({
    status: Joi.string().valid('available', 'redeemed', 'disabled').optional(),
  }),
})
export class ListWristbands implements RabApiGet<ControllerT> {
  constructor(private useCase: ListWristbandsUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ status: request.query.status });
  };
}
