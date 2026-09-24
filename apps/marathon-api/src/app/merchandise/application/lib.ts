import { Prisma } from '@marathon-api/prisma';
import { BaseMerchandise } from '@marathon/core';

export const MerchandiseSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
} satisfies Prisma.MerchandiseSelect;

export type MerchandiseFromDB = Prisma.MerchandiseGetPayload<{
  select: typeof MerchandiseSelect;
}>;

export function mapMerchandise(row: MerchandiseFromDB): BaseMerchandise {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
  };
}
