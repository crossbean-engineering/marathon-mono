import { RabApi } from '@rabstack/rab-api';
import { otpRouter } from './otp/router';
import { authRouter } from './auth/router';
import { meRouter } from './me/router';
import { merchandiseRouter } from './merchandise/router';
import { packageRouter } from './package/router';
import { couponRouter } from './coupon/router';
import { participantRouter } from './participant/router';
import { paymentRouter } from './payment/router';
import { wristbandRouter } from './wristband/router';
import { adminRouter } from './admin/router';
import { reportRouter } from './report/router';

export const appRouter = RabApi.createRouter({
  basePath: '',
  tags: ['Marathon'],
  controllers: [
    otpRouter,
    authRouter,
    meRouter,
    merchandiseRouter,
    packageRouter,
    couponRouter,
    participantRouter,
    paymentRouter,
    wristbandRouter,
    adminRouter,
    reportRouter,
  ],
});
