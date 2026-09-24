import { Payment } from '@marathon-api/prisma';
import { BasePayment } from '@marathon/core';

export function mapPayment(row: Payment): BasePayment {
  return {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    provider: row.provider,
    gateway: row.gateway,
    orderId: row.orderId,
    transactionId: row.transactionId,
    momoNumber: row.momoNumber,
    network: row.network,
    paymentMethod: row.paymentMethod,
    email: row.email,
    reason: row.reason,
    requiresAttention: row.requiresAttention,
    performedBy: row.performedBy,
    confirmedAt: row.confirmedAt ? row.confirmedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
