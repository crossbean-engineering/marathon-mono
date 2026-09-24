import { Put, RabApiPut } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { UpdatePackageUseCase } from '../application';

type ControllerT = ApiSpec<'updatePackage'>;

@Put(MarathonApis.updatePackage, {
  permission: AppAccess.canManageCatalog,
  bodySchema: Joi.object({
    name: Joi.string().optional(),
    price: Joi.number().integer().min(0).optional(),
    benefits: Joi.string().optional(),
    merchandiseIds: Joi.array().items(Joi.string()).optional(),
    prizes: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().optional(),
          name: Joi.string().required(),
          amount: Joi.number().integer().min(0).optional(),
          position: Joi.number().integer().optional(),
          description: Joi.string().optional(),
        }),
      )
      .optional(),
  }),
})
export class UpdatePackage implements RabApiPut<ControllerT> {
  constructor(private useCase: UpdatePackageUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({
      id: request.params.id,
      payload: request.body,
    });
  };
}
