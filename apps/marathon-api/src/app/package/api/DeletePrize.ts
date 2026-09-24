import { Delete, RabApiDelete } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { DeletePrizeUseCase } from '../application';

type ControllerT = ApiSpec<'deletePrize'>;

@Delete(MarathonApis.deletePrize, {
  permission: AppAccess.canManageCatalog,
})
export class DeletePrize implements RabApiDelete<ControllerT> {
  constructor(private useCase: DeletePrizeUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({
      packageId: request.params.packageId,
      prizeId: request.params.prizeId,
    });
  };
}
