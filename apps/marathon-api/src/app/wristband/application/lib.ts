import { Prisma } from '@marathon-api/prisma';
import { BaseWristband } from '@marathon/core';

export const WristbandSelect = {
  id: true,
  code: true,
  status: true,
  isPrinted: true,
  participantId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WristbandSelect;

export type WristbandFromDB = Prisma.WristbandGetPayload<{
  select: typeof WristbandSelect;
}>;

export function mapWristband(row: WristbandFromDB): BaseWristband {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    isPrinted: row.isPrinted,
    participantId: row.participantId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
