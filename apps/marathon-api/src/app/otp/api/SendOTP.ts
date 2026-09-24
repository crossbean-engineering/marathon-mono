import { Post, RabApiPost } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec } from '@marathon-api/shared';
import { SendOTPUseCase } from '../application';
import { sendOTPSchema } from './lib/schemas';

type ControllerT = ApiSpec<'sendOTP'>;

@Post(MarathonApis.sendOTP, {
  bodySchema: sendOTPSchema,
  isProtected: false,
})
export class SendOTP implements RabApiPost<ControllerT> {
  constructor(private useCase: SendOTPUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return await this.useCase.execute({ payload: request.body });
  };
}
