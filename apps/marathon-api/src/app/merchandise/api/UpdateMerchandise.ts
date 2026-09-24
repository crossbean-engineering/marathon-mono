import { Put, RabApiPut } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { UpdateMerchandiseUseCase } from '../application';

type ControllerT = ApiSpec<'updateMerchandise'>;

@Put(MarathonApis.updateMerchandise, {
  permission: AppAccess.canManageCatalog,
  bodySchema: Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
  }),
})
export class UpdateMerchandise implements RabApiPut<ControllerT> {
  constructor(private useCase: UpdateMerchandiseUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({
      id: request.params.id,
      payload: request.body,
    });
  };
}
