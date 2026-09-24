import { BadRequestException, Injectable } from '@rabstack/rab-api';
import { ErrorCode } from '@marathon/core';
import { VerifyOTPUseCase } from '@marathon-api/app/otp';
import { PaymentSessionService } from './PaymentSessionService';

export type BuyPackageValidationParams = {
  userId: string;
  momoNumber: string;
  otp?: string;
  otpSessionId?: string;
  sessionToken?: string; // if valid, skips OTP re-verification
};

export type BuyPackageValidationResult = {
  sessionToken: string;
};

/**
 * Gates buyPackage on control of the paying momo number: reuse a valid payment
 * session to skip OTP, otherwise verify the OTP (identifier = momoNumber) and
 * mint a fresh session token bound to userId + momoNumber.
 */
@Injectable()
export class BuyPackageValidationUseCase {
  constructor(
    private readonly verifyOTPUseCase: VerifyOTPUseCase,
    private readonly paymentSessionService: PaymentSessionService,
  ) {}

  async execute(
    params: BuyPackageValidationParams,
  ): Promise<BuyPackageValidationResult> {
    const { userId, momoNumber, otp, otpSessionId, sessionToken } = params;

    if (sessionToken) {
      const valid = await this.paymentSessionService.validate(
        sessionToken,
        userId,
        momoNumber,
      );
      if (valid) {
        return { sessionToken };
      }
      // session invalid/expired — require OTP credentials to re-mint
      if (!otpSessionId || !otp) {
        throw new BadRequestException(
          'Invalid or expired payment session',
          undefined,
          ErrorCode.SESSION_EXPIRED,
        );
      }
    }

    if (!otpSessionId || !otp) {
      throw new BadRequestException(
        'OTP verification is required to pay',
        undefined,
        ErrorCode.OTP_REQUIRED,
      );
    }

    await this.verifyOTPUseCase.execute({
      payload: { sessionId: otpSessionId, otp, identifier: momoNumber },
    });

    const freshToken = await this.paymentSessionService.issue(
      userId,
      momoNumber,
    );
    return { sessionToken: freshToken };
  }
}
