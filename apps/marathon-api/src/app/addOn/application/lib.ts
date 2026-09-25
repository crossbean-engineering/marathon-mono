import { Prisma } from '@marathon-api/prisma';
import { BaseAddOn, ParticipantAddOnSummary } from '@marathon/core';
import { db } from '@marathon-api/core';
import {
  AddOnCandidate,
  AddOnLine,
  remainingCapacity,
  selectAddOns,
  sumAddOnLines,
  toAddOnLines,
} from './selection';

// A booking holds a spot while its participant is pending (payment in flight)
// or active. A failed payment suspends the participant and frees the spot.
export const HOLDING_STATUSES = ['pending', 'active'] as const;

export const AddOnSelect = {
  id: true,
  type: true,
  name: true,
  provider: true,
  description: true,
  occupancy: true,
  price: true,
  capacity: true,
  isActive: true,
  createdAt: true,
  _count: {
    select: {
      bookings: {
        where: { participant: { status: { in: [...HOLDING_STATUSES] } } },
      },
    },
  },
} satisfies Prisma.AddOnSelect;

export type AddOnFromDB = Prisma.AddOnGetPayload<{
  select: typeof AddOnSelect;
}>;

export function mapAddOn(row: AddOnFromDB): BaseAddOn {
  const booked = row._count.bookings;
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    provider: row.provider,
    description: row.description,
    occupancy: row.occupancy,
    price: row.price,
    capacity: row.capacity,
    booked,
    remaining: remainingCapacity(row.capacity, booked),
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

function toCandidate(row: AddOnFromDB): AddOnCandidate {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    price: row.price,
    isActive: row.isActive,
    capacity: row.capacity,
    booked: row._count.bookings,
  };
}

// Include for a participant's booked add-ons, with the add-on details.
export const ParticipantAddOnInclude = {
  include: {
    addOn: {
      select: { type: true, name: true, provider: true, occupancy: true },
    },
  },
  orderBy: { createdAt: 'asc' },
} satisfies Prisma.Participant$addOnsArgs;

export type ParticipantAddOnRow = {
  addOnId: string;
  price: number;
  addOn: {
    type: BaseAddOn['type'];
    name: string;
    provider: string | null;
    occupancy: number | null;
  };
};

export function mapParticipantAddOn(
  row: ParticipantAddOnRow,
): ParticipantAddOnSummary {
  return {
    addOnId: row.addOnId,
    type: row.addOn.type,
    name: row.addOn.name,
    provider: row.addOn.provider,
    occupancy: row.addOn.occupancy,
    price: row.price,
  };
}

// "KOD Apartment — Double room (2 sharing)" for rooms, the name otherwise.
export function describeAddOn(
  addOn: Pick<ParticipantAddOnSummary, 'name' | 'provider' | 'occupancy'>,
): string {
  const label = addOn.provider ? `${addOn.provider} — ${addOn.name}` : addOn.name;
  return addOn.occupancy ? `${label} (${addOn.occupancy} sharing)` : label;
}

export type ResolvedAddOns = {
  lines: AddOnLine[];
  total: number; // pesewas
};

// Resolve the add-ons a registration will book and charge for.
// - New participant: `addOnIds` (or none).
// - Retry for an existing participant: `addOnIds` replaces their add-ons; when
//   omitted, their current add-ons are kept. Either way they are re-validated
//   and priced at today's catalog price.
export async function resolvePurchaseAddOns(
  addOnIds: string[] | undefined,
  existingParticipantId?: string,
): Promise<ResolvedAddOns> {
  const existing = existingParticipantId
    ? await db.participantAddOn.findMany({
        where: { participantId: existingParticipantId },
        select: { addOnId: true, participant: { select: { status: true } } },
      })
    : [];

  const requested = addOnIds ?? existing.map((b) => b.addOnId);
  if (requested.length === 0) return { lines: [], total: 0 };

  const rows = await db.addOn.findMany({
    where: { id: { in: [...new Set(requested)] } },
    select: AddOnSelect,
  });

  const held = new Set(existing.map((b) => b.addOnId));
  const counted = new Set(
    existing
      .filter((b) =>
        (HOLDING_STATUSES as readonly string[]).includes(b.participant.status),
      )
      .map((b) => b.addOnId),
  );

  const selected = selectAddOns(requested, rows.map(toCandidate), {
    allowInactive: held,
    skipCapacity: counted,
  });
  const lines = toAddOnLines(selected);
  return { lines, total: sumAddOnLines(lines) };
}
