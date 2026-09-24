import { Get, RabApiGet } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { db } from '@marathon-api/core';
import { mapPayment } from '../application';

type ControllerT = ApiSpec<'listPayments'>;

@Get(MarathonApis.listPayments, {
  permission: AppAccess.canReadPayments,
  querySchema: Joi.object({
    method: Joi.string().valid('card', 'momo', 'cash', 'waived').optional(),
    status: Joi.string().valid('pending', 'completed', 'failed').optional(),
  }),
})
export class ListPayments implements RabApiGet<ControllerT> {
  handler: ControllerT['request'] = async (request) => {
    const rows = await db.payment.findMany({
      where: {
        paymentMethod: request.query.method,
        status: request.query.status,
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapPayment);
  };
}
