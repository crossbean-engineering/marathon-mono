import { BaseUser } from './user';

export type SignUpBody = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  idNumber?: string;
  location?: string;
  otp: string;
  otpSessionId: string;
};
export type LoginBody = { phone: string; otp: string; otpSessionId: string };
export type AuthResponse = { accessToken: string; user: BaseUser };
