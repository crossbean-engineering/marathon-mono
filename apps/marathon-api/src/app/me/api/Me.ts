import { Get, RabApiGet } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec } from '@marathon-api/shared';
import { GetMeUseCase } from '../application';

type ControllerT = ApiSpec<'me'>;

// Protected (JWT required) but no specific permission — any authenticated user
// can read their own profile + the participants they created.
@Get(MarathonApis.me)
export class Me implements RabApiGet<ControllerT> {
  constructor(private useCase: GetMeUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ userId: request.auth.userId });
  };
}
