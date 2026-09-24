import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { CreatePackageUseCase } from '../application';

type ControllerT = ApiSpec<'createPackage'>;

@Post(MarathonApis.createPackage, {
  permission: AppAccess.canManageCatalog,
  bodySchema: Joi.object({
    name: Joi.string().required(),
    price: Joi.number().integer().min(0).required(),
    benefits: Joi.string().optional(),
    merchandiseIds: Joi.array().items(Joi.string()).optional(),
    prizes: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          amount: Joi.number().integer().min(0).optional(),
          position: Joi.number().integer().optional(),
          description: Joi.string().optional(),
        }),
      )
      .optional(),
  }),
})
export class CreatePackage implements RabApiPost<ControllerT> {
  constructor(private useCase: CreatePackageUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ payload: request.body });
  };
}
