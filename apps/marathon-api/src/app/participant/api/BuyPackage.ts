import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis, BuyPackageResponse } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import {
  BuyPackageValidationUseCase,
  IdempotencyService,
} from '@marathon-api/app/payment';
import { BuyPackageUseCase } from '../application';

type ControllerT = ApiSpec<'buyPackage'>;

@Post(MarathonApis.buyPackage, {
  permission: AppAccess.canBuyPackage,
  bodySchema: Joi.object({
    // New participant: packageId + participant. Retry a failed payment for an
    // existing participant: participantId instead. Exactly one of participant/
    // participantId. packageId is required with a new participant; on retry it
    // is optional — pass it to switch the participant to a different package.
    packageId: Joi.string().when('participant', {
      is: Joi.exist(),
      then: Joi.required(),
    }),
    participant: Joi.object({
      name: Joi.string().required(),
      ic: Joi.string().optional(),
      shirtSize: Joi.string().optional(),
      gender: Joi.string().valid('male', 'female').optional(),
    }),
    participantId: Joi.string(),
    // Weekend Package add-ons, at most one per type.
    addOnIds: Joi.array().items(Joi.string()).max(10).optional(),
    payment: Joi.object({
      momoNumber: Joi.string().required(),
      network: Joi.string().valid('MTN', 'VODAFONE', 'AIRTELTIGO').required(),
      email: Joi.string().email().optional(),
    }).required(),
    // Payment safety layer: OTP-verify the momo number (or reuse a session),
    // and dedup retries with an idempotency key.
    otp: Joi.string().optional(),
    otpSessionId: Joi.string().optional(),
    sessionToken: Joi.string().uuid().optional(),
    idempotencyKey: Joi.string().optional(),
    // Optional promo code applied to the resolved package's price.
    couponCode: Joi.string().optional(),
  }).xor('participant', 'participantId'),
})
export class BuyPackage implements RabApiPost<ControllerT> {
  constructor(
    private useCase: BuyPackageUseCase,
    private validationUseCase: BuyPackageValidationUseCase,
    private idempotencyService: IdempotencyService,
  ) {}

  handler: ControllerT['request'] = async (request) => {
    const { idempotencyKey } = request.body;

    // Dedup: a retry with the same key returns the original response.
    if (idempotencyKey) {
      const cached =
        await this.idempotencyService.getResult<BuyPackageResponse>(
          idempotencyKey,
        );
      if (cached) return cached;
    }

    // OTP-first (or valid session) gate on the paying momo number.
    const { sessionToken } = await this.validationUseCase.execute({
      userId: request.auth.userId,
      momoNumber: request.body.payment.momoNumber,
      otp: request.body.otp,
      otpSessionId: request.body.otpSessionId,
      sessionToken: request.body.sessionToken,
    });

    const result = await this.useCase.execute({
      payload: request.body,
      userId: request.auth.userId,
    });

    const response: BuyPackageResponse = { ...result, sessionToken };

    if (idempotencyKey) {
      try {
        await this.idempotencyService.storeResult(idempotencyKey, response);
      } catch {
        console.error('[BuyPackage] Failed to store idempotency result');
      }
    }

    return response;
  };
}
