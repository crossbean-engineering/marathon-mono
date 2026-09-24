import { Get, RabApiGet } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { GetWristbandUseCase } from '../application';

type ControllerT = ApiSpec<'getWristband'>;

@Get(MarathonApis.getWristband, {
  permission: AppAccess.canManageWristbands,
})
export class GetWristband implements RabApiGet<ControllerT> {
  constructor(private useCase: GetWristbandUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ id: request.params.id });
  };
}
