export type OTPProvider = 'sms';
export type SendOTPBody = { identifier: string; provider: OTPProvider };
export type SendOTPResponse = { sessionId: string; expiresAt: string; provider: OTPProvider };
export type VerifyOTPBody = { sessionId: string; otp: string; identifier: string };
export type VerifyOTPResponse = { valid: boolean; provider: OTPProvider };
