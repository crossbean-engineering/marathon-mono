import { Delete, RabApiDelete } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { DeleteCouponUseCase } from '../application';

type ControllerT = ApiSpec<'deleteCoupon'>;

@Delete(MarathonApis.deleteCoupon, {
  permission: AppAccess.canManageCatalog,
})
export class DeleteCoupon implements RabApiDelete<ControllerT> {
  constructor(private useCase: DeleteCouponUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ id: request.params.id });
  };
}
