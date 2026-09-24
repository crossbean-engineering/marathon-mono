  import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { RedeemWristbandUseCase } from '../application';

type ControllerT = ApiSpec<'redeemWristband'>;

@Post(MarathonApis.redeemWristband, {
  permission: AppAccess.canRedeemWristband,
  bodySchema: Joi.object({
    wristbandCode: Joi.string().required(),
    participantCode: Joi.string().required(),
  }),
})
export class RedeemWristband implements RabApiPost<ControllerT> {
  constructor(private useCase: RedeemWristbandUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    return this.useCase.execute({ payload: request.body });
  };
}
