import { RabApi } from '@rabstack/rab-api';
import { SendOTP } from './api/SendOTP';

export const otpRouter = RabApi.createRouter({
  basePath: '',
  tags: ['OTP'],
  controllers: [SendOTP],
});
