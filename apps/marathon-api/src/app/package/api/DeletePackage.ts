import { Delete, RabApiDelete } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { DeletePackageUseCase } from '../application';

type ControllerT = ApiSpec<'deletePackage'>;

@Delete(MarathonApis.deletePackage, {
  permission: AppAccess.canManageCatalog,
})
export class DeletePackage implements RabApiDelete<ControllerT> {
  constructor(private useCase: DeletePackageUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ id: request.params.id });
  };
}
