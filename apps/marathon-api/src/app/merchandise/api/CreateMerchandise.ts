import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { CreateMerchandiseUseCase } from '../application';

type ControllerT = ApiSpec<'createMerchandise'>;

@Post(MarathonApis.createMerchandise, {
  permission: AppAccess.canManageCatalog,
  bodySchema: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
  }),
})
export class CreateMerchandise implements RabApiPost<ControllerT> {
  constructor(private useCase: CreateMerchandiseUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ payload: request.body });
  };
}
