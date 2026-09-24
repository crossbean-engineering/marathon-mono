import { Get, RabApiGet } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { GetCouponUseCase } from '../application';

type ControllerT = ApiSpec<'getCoupon'>;

@Get(MarathonApis.getCoupon, {
  permission: AppAccess.canManageCatalog,
})
export class GetCoupon implements RabApiGet<ControllerT> {
  constructor(private useCase: GetCouponUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ id: request.params.id });
  };
}
