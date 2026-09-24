import { Get, RabApiGet } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec } from '@marathon-api/shared';
import { ListMerchandiseUseCase } from '../application';

type ControllerT = ApiSpec<'listMerchandise'>;

@Get(MarathonApis.listMerchandise, {
  isProtected: false,
})
export class ListMerchandise implements RabApiGet<ControllerT> {
  constructor(private useCase: ListMerchandiseUseCase) {}
  handler: ControllerT['request'] = async () => {
    return this.useCase.execute();
  };
}
