import { Get, RabApiGet } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { ListUsersUseCase } from '../application';

type ControllerT = ApiSpec<'listUsers'>;

@Get(MarathonApis.listUsers, {
  permission: AppAccess.canManageUsers,
  querySchema: Joi.object({
    role: Joi.string().valid('user', 'agent', 'admin').optional(),
  }),
})
export class ListUsers implements RabApiGet<ControllerT> {
  constructor(private useCase: ListUsersUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ role: request.query.role });
  };
}
