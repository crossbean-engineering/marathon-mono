import { Get, RabApiGet } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec } from '@marathon-api/shared';
import { GetPackageUseCase } from '../application';

type ControllerT = ApiSpec<'getPackage'>;

@Get(MarathonApis.getPackage, {
  isProtected: false,
})
export class GetPackage implements RabApiGet<ControllerT> {
  constructor(private useCase: GetPackageUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ id: request.params.id });
  };
}
