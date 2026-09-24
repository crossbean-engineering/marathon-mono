import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec } from '@marathon-api/shared';
import { VerifyPaymentUseCase } from '../application';

type ControllerT = ApiSpec<'verifyPayment'>;

@Post(MarathonApis.verifyPayment, {
  isProtected: false,
  bodySchema: Joi.object({
    transactionId: Joi.string().required(),
  }),
})
export class VerifyPayment implements RabApiPost<ControllerT> {
  constructor(private useCase: VerifyPaymentUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({
      transactionId: request.body.transactionId,
    });
  };
}
