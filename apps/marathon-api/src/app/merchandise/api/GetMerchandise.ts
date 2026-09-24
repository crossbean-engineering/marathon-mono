import { Get, RabApiGet } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec } from '@marathon-api/shared';
import { GetMerchandiseUseCase } from '../application';

type ControllerT = ApiSpec<'getMerchandise'>;

@Get(MarathonApis.getMerchandise, {
  isProtected: false,
})
export class GetMerchandise implements RabApiGet<ControllerT> {
  constructor(private useCase: GetMerchandiseUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ id: request.params.id });
  };
}
