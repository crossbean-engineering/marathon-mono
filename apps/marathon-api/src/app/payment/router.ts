import { RabApi } from '@rabstack/rab-api';
import { VerifyPayment } from './api/VerifyPayment';
import { CollectionCallback } from './api/CollectionCallback';
import { ListPayments } from './api/ListPayments';

export const paymentRouter = RabApi.createRouter({
  basePath: '',
  tags: ['Payment'],
  controllers: [VerifyPayment, CollectionCallback, ListPayments],
});
