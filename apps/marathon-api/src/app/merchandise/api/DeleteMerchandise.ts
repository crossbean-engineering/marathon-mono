import { Delete, RabApiDelete } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { DeleteMerchandiseUseCase } from '../application';

type ControllerT = ApiSpec<'deleteMerchandise'>;

@Delete(MarathonApis.deleteMerchandise, {
  permission: AppAccess.canManageCatalog,
})
export class DeleteMerchandise implements RabApiDelete<ControllerT> {
  constructor(private useCase: DeleteMerchandiseUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ id: request.params.id });
  };
}
