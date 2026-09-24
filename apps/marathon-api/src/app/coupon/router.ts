import { RabApi } from '@rabstack/rab-api';
import { CreateCoupon } from './api/CreateCoupon';
import { ListCoupons } from './api/ListCoupons';
import { GetCoupon } from './api/GetCoupon';
import { UpdateCoupon } from './api/UpdateCoupon';
import { DeleteCoupon } from './api/DeleteCoupon';
import { ValidateCoupon } from './api/ValidateCoupon';

export const couponRouter = RabApi.createRouter({
  basePath: '',
  tags: ['Coupon'],
  controllers: [
    CreateCoupon,
    ListCoupons,
    // ValidateCoupon before GetCoupon so POST /coupons/validate is matched
    // ahead of the /coupons/:id parameter route.
    ValidateCoupon,
    GetCoupon,
    UpdateCoupon,
    DeleteCoupon,
  ],
});
