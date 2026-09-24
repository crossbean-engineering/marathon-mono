import { Get, RabApiGet } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { ListCouponsUseCase } from '../application';

type ControllerT = ApiSpec<'listCoupons'>;

@Get(MarathonApis.listCoupons, {
  permission: AppAccess.canManageCatalog,
})
export class ListCoupons implements RabApiGet<ControllerT> {
  constructor(private useCase: ListCouponsUseCase) {}
  handler: ControllerT['request'] = async () => {
    return this.useCase.execute();
  };
}
