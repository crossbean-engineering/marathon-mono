import { Delete, RabApiDelete } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { DeleteAddOnUseCase } from '../application';

type ControllerT = ApiSpec<'deleteAddOn'>;

@Delete(MarathonApis.deleteAddOn, {
  permission: AppAccess.canManageCatalog,
})
export class DeleteAddOn implements RabApiDelete<ControllerT> {
  constructor(private useCase: DeleteAddOnUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ id: request.params.id });
  };
}
