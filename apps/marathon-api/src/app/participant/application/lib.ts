import { Participant, Prisma } from '@marathon-api/prisma';
import { BaseParticipant } from '@marathon/core';
import {
  mapParticipantAddOn,
  ParticipantAddOnRow,
} from '@marathon-api/app/addOn';

// Scalar package fields to select when embedding basic package info on a
// participant (see BaseParticipant.package).
export const PackageSummarySelect = {
  id: true,
  name: true,
  price: true,
  benefits: true,
} satisfies Prisma.PackageSelect;

type PackageSummaryRow = Prisma.PackageGetPayload<{
  select: typeof PackageSummarySelect;
}>;

// Accepts a plain participant row, or one with its wristband/package relations
// included. wristbandCode is null when the participant has no linked band;
// package is only present when the caller selected it.
// Collected merchandise rows joined to their merchandise, when included.
export const CollectedMerchandiseInclude = {
  include: { merchandise: { select: { name: true, description: true } } },
  orderBy: { collectedAt: 'asc' },
} satisfies Prisma.Participant$collectedMerchandiseArgs;

type CollectedMerchandiseRow = {
  merchandiseId: string;
  collectedAt: Date;
  merchandise: { name: string; description: string | null };
};

type ParticipantRow = Participant & {
  wristband?: { code: string } | null;
  package?: PackageSummaryRow | null;
  collectedMerchandise?: CollectedMerchandiseRow[];
  addOns?: ParticipantAddOnRow[];
};

export function mapParticipant(row: ParticipantRow): BaseParticipant {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    ic: row.ic,
    shirtSize: row.shirtSize,
    gender: row.gender,
    status: row.status,
    runnerNumber: row.runnerNumber,
    checkinDate: row.checkinDate ? row.checkinDate.toISOString() : null,
    packageId: row.packageId,
    package: row.package
      ? {
          id: row.package.id,
          name: row.package.name,
          price: row.package.price,
          benefits: row.package.benefits,
        }
      : undefined,
    collectedMerchandise: row.collectedMerchandise?.map((item) => ({
      merchandiseId: item.merchandiseId,
      name: item.merchandise.name,
      description: item.merchandise.description,
      collectedAt: item.collectedAt.toISOString(),
    })),
    addOns: row.addOns?.map(mapParticipantAddOn),
    userId: row.userId,
    wristbandCode: row.wristband?.code ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
