import { Injectable, BadRequestException } from '@rabstack/rab-api';
import type { VerifyOTPBody, VerifyOTPResponse } from '@marathon/core';
import { ErrorCode } from '@marathon/core';
import { OTPStorageService } from './OTPStorageService';

export type VerifyOTPUseCaseParams = {
  payload: VerifyOTPBody;
};

@Injectable()
export class VerifyOTPUseCase {
  constructor(private readonly otpStorage: OTPStorageService) {}

  async execute(params: VerifyOTPUseCaseParams): Promise<VerifyOTPResponse> {
    const { sessionId, otp, identifier } = params.payload;

    if (!sessionId || !otp || !identifier) {
      throw new BadRequestException(
        'Session ID, OTP, and identifier are required',
        undefined,
        ErrorCode.INVALID_INPUT,
      );
    }

    const isValid = await this.otpStorage.verifyOTP(sessionId, otp);

    if (!isValid) {
      throw new BadRequestException(
        'Invalid or expired OTP',
        undefined,
        ErrorCode.INVALID_OTP,
      );
    }

    const session = await this.otpStorage.getSession(sessionId);

    if (!session) {
      throw new BadRequestException(
        'OTP session not found',
        undefined,
        ErrorCode.OTP_SESSION_NOT_FOUND,
      );
    }

    const normalizedIdentifier = identifier.toLowerCase();
    const normalizedSessionIdentifier = session.identifier.toLowerCase();

    if (normalizedIdentifier !== normalizedSessionIdentifier) {
      throw new BadRequestException(
        'Phone number does not match OTP session',
        undefined,
        ErrorCode.PHONE_MISMATCH,
      );
    }

    return {
      valid: true,
      provider: 'sms',
    };
  }
}
