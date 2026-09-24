import { Put, RabApiPut } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { UpdateWristbandUseCase } from '../application';

type ControllerT = ApiSpec<'updateWristband'>;

@Put(MarathonApis.updateWristband, {
  permission: AppAccess.canManageWristbands,
  bodySchema: Joi.object({
    status: Joi.string().valid('available', 'redeemed', 'disabled').optional(),
    isPrinted: Joi.boolean().optional(),
  }),
})
export class UpdateWristband implements RabApiPut<ControllerT> {
  constructor(private useCase: UpdateWristbandUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({
      id: request.params.id,
      payload: request.body,
    });
  };
}
