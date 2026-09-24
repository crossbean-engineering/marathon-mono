import { Prisma } from '@marathon-api/prisma';
import { BasePackage, BasePrize } from '@marathon/core';
import { MerchandiseSelect, mapMerchandise } from '../../merchandise';

export const PackageInclude = {
  merchandise: { select: MerchandiseSelect },
  prizes: true,
} satisfies Prisma.PackageInclude;

export type PackageFromDB = Prisma.PackageGetPayload<{
  include: typeof PackageInclude;
}>;

export function mapPrize(row: PackageFromDB['prizes'][number]): BasePrize {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    position: row.position,
    description: row.description,
  };
}

export function mapPackage(row: PackageFromDB): BasePackage {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    benefits: row.benefits,
    merchandise: row.merchandise.map(mapMerchandise),
    prizes: row.prizes.map(mapPrize),
    createdAt: row.createdAt.toISOString(),
  };
}
