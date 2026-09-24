import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { CheckInParticipantUseCase } from '../application';

type ControllerT = ApiSpec<'checkInParticipant'>;

@Post(MarathonApis.checkInParticipant, {
  permission: AppAccess.canCheckInParticipant,
  bodySchema: Joi.object({
    runnerNumber: Joi.string().trim().required(),
    // Optional: pass it to correct the size on record when a different one is
    // issued at the desk.
    shirtSize: Joi.string().trim().optional(),
  }),
})
export class CheckInParticipant implements RabApiPost<ControllerT> {
  constructor(private useCase: CheckInParticipantUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({
      id: request.params.id,
      payload: request.body,
    });
  };
}
