import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec } from '@marathon-api/shared';
import { VerifyOTPUseCase } from '@marathon-api/app/otp';
import { SignUpUseCase } from '../application';

type ControllerT = ApiSpec<'signUp'>;

@Post(MarathonApis.signUp, {
  isProtected: false,
  bodySchema: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string()
      .pattern(/^[1-9]\d{6,14}$/)
      .required()
      .messages({
        'string.pattern.base':
          'Phone number must be digits only without + prefix',
      }),
    email: Joi.string().email().optional(),
    idNumber: Joi.string().optional(),
    location: Joi.string().optional(),
    otp: Joi.string().required(),
    otpSessionId: Joi.string().required(),
  }),
})
export class SignUp implements RabApiPost<ControllerT> {
  constructor(
    private useCase: SignUpUseCase,
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
