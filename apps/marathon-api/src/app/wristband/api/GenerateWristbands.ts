import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { GenerateWristbandsUseCase } from '../application';

type ControllerT = ApiSpec<'generateWristbands'>;

@Post(MarathonApis.generateWristbands, {
  permission: AppAccess.canManageWristbands,
  bodySchema: Joi.object({
    count: Joi.number().integer().min(1).max(100).optional(),
  }),
})
export class GenerateWristbands implements RabApiPost<ControllerT> {
  constructor(private useCase: GenerateWristbandsUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ payload: request.body });
  };
}
