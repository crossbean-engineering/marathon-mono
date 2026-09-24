import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec } from '@marathon-api/shared';
import { BootstrapAdminUseCase } from '../application';

type ControllerT = ApiSpec<'bootstrapAdmin'>;

@Post(MarathonApis.bootstrapAdmin, {
  isProtected: false,
  bodySchema: Joi.object({
    secret: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string()
      .pattern(/^[1-9]\d{6,14}$/)
      .required()
      .messages({
        'string.pattern.base':
          'Phone number must be digits only without + prefix',
      }),
    email: Joi.string().email().optional(),
  }),
})
export class Bootstrap implements RabApiPost<ControllerT> {
  constructor(private useCase: BootstrapAdminUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ payload: request.body });
  };
}
