import { Get, RabApiGet } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec } from '@marathon-api/shared';
import { ListPackagesUseCase } from '../application';

type ControllerT = ApiSpec<'listPackages'>;

@Get(MarathonApis.listPackages, {
  isProtected: false,
})
export class ListPackages implements RabApiGet<ControllerT> {
  constructor(private useCase: ListPackagesUseCase) {}
  handler: ControllerT['request'] = async () => {
    return this.useCase.execute();
  };
}
