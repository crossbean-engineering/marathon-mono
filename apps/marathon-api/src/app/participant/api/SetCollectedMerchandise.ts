import { Put, RabApiPut } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { SetCollectedMerchandiseUseCase } from '../application';

type ControllerT = ApiSpec<'setCollectedMerchandise'>;

// PUT, not PATCH: merchandiseIds is the full desired state, not a delta.
@Put(MarathonApis.setCollectedMerchandise, {
  permission: AppAccess.canCollectMerchandise,
  bodySchema: Joi.object({
    // Empty array is valid and clears everything collected.
    merchandiseIds: Joi.array().items(Joi.string()).required(),
  }),
})
export class SetCollectedMerchandise implements RabApiPut<ControllerT> {
  constructor(private useCase: SetCollectedMerchandiseUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({
      id: request.params.id,
      payload: request.body,
    });
  };
}
