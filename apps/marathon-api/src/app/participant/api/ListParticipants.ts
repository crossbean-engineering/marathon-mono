import { Get, RabApiGet } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { ListParticipantsUseCase } from '../application';

type ControllerT = ApiSpec<'listParticipants'>;

@Get(MarathonApis.listParticipants, {
  permission: AppAccess.canReadParticipants,
  querySchema: Joi.object({
    packageId: Joi.string().optional(),
    status: Joi.string().valid('pending', 'active', 'suspended').optional(),
    code: Joi.string().optional(),
    userId: Joi.string().optional(),
    wristbandCode: Joi.string().optional(),
    gender: Joi.string().valid('male', 'female').optional(),
    shirtSize: Joi.string().trim().optional(),
    addOnId: Joi.string().optional(),
  }),
})
export class ListParticipants implements RabApiGet<ControllerT> {
  constructor(private useCase: ListParticipantsUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({
      packageId: request.query.packageId,
      status: request.query.status,
      code: request.query.code,
      userId: request.query.userId,
      wristbandCode: request.query.wristbandCode,
      gender: request.query.gender,
      shirtSize: request.query.shirtSize,
      addOnId: request.query.addOnId,
    });
  };
}
