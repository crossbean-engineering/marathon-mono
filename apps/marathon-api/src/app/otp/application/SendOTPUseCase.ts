import { Injectable, BadRequestException } from '@rabstack/rab-api';
import { SendOTPBody, SendOTPResponse } from '@marathon/core';
import { OTPStorageService } from './OTPStorageService';
import { SMSService } from '@marathon-api/integration';

export type SendOTPUseCaseParams = {
  payload: SendOTPBody;
};

@Injectable()
export class SendOTPUseCase {
  constructor(
    private readonly otpStorage: OTPStorageService,
    private readonly smsService: SMSService,
  ) {}

  async execute(params: SendOTPUseCaseParams): Promise<SendOTPResponse> {
    const { identifier, provider } = params.payload;

    const inCooldown = await this.otpStorage.isInCooldown(identifier);
    if (inCooldown) {
      throw new BadRequestException('Please wait before requesting a new OTP');
    }

    const { session, otp } = await this.otpStorage.createSession(
      identifier,
      provider,
    );

    try {
      await this.smsService.send(
        identifier,
        `Your OTP code is: ${otp}. Valid for 10 minutes.`,
      );
    } catch (error) {
      console.error('Failed to send OTP via sms:', error);
      await this.otpStorage.deleteSession(session.sessionId);
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }

    return {
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      provider: 'sms',
    };
  }
}
