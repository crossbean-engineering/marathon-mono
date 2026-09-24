import { Post, RabApiPost } from '@rabstack/rab-api';
import Joi from 'joi';
import { ClaimFreePackageResponse, MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { IdempotencyService } from '@marathon-api/app/payment';
import { ClaimFreePackageUseCase } from '../application';

type ControllerT = ApiSpec<'claimFreePackage'>;

@Post(MarathonApis.claimFreePackage, {
  permission: AppAccess.canBuyPackage,
  bodySchema: Joi.object({
    // New participant: packageId + participant. Existing participant:
    // participantId instead, with packageId optional to switch package.
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
    // Must resolve to a 100% discount on the package, else the claim is
    // rejected. No OTP or momo details — nothing is charged.
    couponCode: Joi.string().trim().required(),
    idempotencyKey: Joi.string().optional(),
  }).xor('participant', 'participantId'),
})
export class ClaimFreePackage implements RabApiPost<ControllerT> {
  constructor(
    private useCase: ClaimFreePackageUseCase,
    private idempotencyService: IdempotencyService,
  ) {}

  handler: ControllerT['request'] = async (request) => {
    const { idempotencyKey } = request.body;

    // Dedup: a retry with the same key returns the original response.
    if (idempotencyKey) {
      const cached =
        await this.idempotencyService.getResult<ClaimFreePackageResponse>(
          idempotencyKey,
        );
      if (cached) return cached;
    }

    const response = await this.useCase.execute({
      payload: request.body,
      userId: request.auth.userId,
    });

    if (idempotencyKey) {
      try {
        await this.idempotencyService.storeResult(idempotencyKey, response);
      } catch {
        console.error('[ClaimFreePackage] Failed to store idempotency result');
      }
    }

    return response;
  };
}