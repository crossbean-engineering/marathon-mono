import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec } from '@marathon-api/shared';
import { VerifyOTPUseCase } from '@marathon-api/app/otp';
import { LoginUseCase } from '../application';

type ControllerT = ApiSpec<'login'>;

@Post(MarathonApis.login, {
  isProtected: false,
  bodySchema: Joi.object({
    phone: Joi.string()
      .pattern(/^[1-9]\d{6,14}$/)
      .required()
      .messages({
        'string.pattern.base':
          'Phone number must be digits only without + prefix',
      }),
    otp: Joi.string().required(),
    otpSessionId: Joi.string().required(),
  }),
})
export class Login implements RabApiPost<ControllerT> {
  constructor(
    private useCase: LoginUseCase,
    private verifyOTPUseCase: VerifyOTPUseCase,
  ) {}
  handler: ControllerT['request'] = async (request) => {
    await this.verifyOTPUseCase.execute({
      payload: {
        sessionId: request.body.otpSessionId,
        otp: request.body.otp,
        identifier: request.body.phone,
      },
    });
    return this.useCase.execute({ payload: request.body });
  };
}
