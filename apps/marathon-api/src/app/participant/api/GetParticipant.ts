import { Get, RabApiGet } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { GetParticipantUseCase } from '../application';

type ControllerT = ApiSpec<'getParticipant'>;

@Get(MarathonApis.getParticipant, {
  permission: AppAccess.canReadParticipants,
})
export class GetParticipant implements RabApiGet<ControllerT> {
  constructor(private useCase: GetParticipantUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ id: request.params.id });
  };
}
