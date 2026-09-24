import { Delete, RabApiDelete } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { DeleteWristbandUseCase } from '../application';

type ControllerT = ApiSpec<'deleteWristband'>;

@Delete(MarathonApis.deleteWristband, {
  permission: AppAccess.canManageWristbands,
})
export class DeleteWristband implements RabApiDelete<ControllerT> {
  constructor(private useCase: DeleteWristbandUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ id: request.params.id });
  };
}
