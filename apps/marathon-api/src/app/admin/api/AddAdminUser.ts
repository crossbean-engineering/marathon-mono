import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { AddAdminUserUseCase } from '../application';

type ControllerT = ApiSpec<'addAdminUser'>;

@Post(MarathonApis.addAdminUser, {
  permission: AppAccess.canManageUsers,
  bodySchema: Joi.object({
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
    role: Joi.string().valid('admin', 'agent').required(),
  }),
})
export class AddAdminUser implements RabApiPost<ControllerT> {
  constructor(private useCase: AddAdminUserUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ payload: request.body });
  };
}
