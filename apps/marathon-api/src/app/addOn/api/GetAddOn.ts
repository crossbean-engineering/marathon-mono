import { Get, RabApiGet } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec } from '@marathon-api/shared';
import { GetAddOnUseCase } from '../application';

type ControllerT = ApiSpec<'getAddOn'>;

@Get(MarathonApis.getAddOn, {
  isProtected: false,
})
export class GetAddOn implements RabApiGet<ControllerT> {
  constructor(private useCase: GetAddOnUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ id: request.params.id });
  };
}
