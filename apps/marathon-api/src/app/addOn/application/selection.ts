import { BadRequestException, NotFoundException } from '@rabstack/rab-api';
import { AddOnType, ErrorCode } from '@marathon/core';

// Pure rules for which add-ons a registration may book and what they cost. No
// database access here — callers load the candidates — so the rules are unit
// tested directly.

export type AddOnCandidate = {
  id: string;
  type: AddOnType;
  name: string;
  price: number; // pesewas, per person
  isActive: boolean;
  capacity: number | null;
  booked: number; // bookings held by pending/active participants
};

export type SelectionOptions = {
  // Add-ons this participant already booked: still bookable after an admin
  // deactivates them, so a failed payment can be retried as-is.
  allowInactive?: ReadonlySet<string>;
  // Add-ons whose spot this participant already holds (it is counted in
  // `booked`), so capacity is not checked against them again.
  skipCapacity?: ReadonlySet<string>;
};

export type AddOnLine = { addOnId: string; price: number };

// Validate the requested add-ons against the loaded candidates. Duplicated ids
// collapse to one booking. Throws on unknown, inactive, sold-out, or two
// add-ons of the same type (one room and one transport seat per person).
export function selectAddOns(
  requestedIds: readonly string[],
  candidates: readonly AddOnCandidate[],
  options: SelectionOptions = {},
): AddOnCandidate[] {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const selected: AddOnCandidate[] = [];
  const seenTypes = new Set<AddOnType>();

  for (const id of new Set(requestedIds)) {
    const addOn = byId.get(id);
    if (!addOn) {
      throw new NotFoundException('Add-on not found', ErrorCode.ADD_ON_NOT_FOUND);
    }
    if (!addOn.isActive && !options.allowInactive?.has(id)) {
      throw new BadRequestException(
        `${addOn.name} is no longer available`,
        undefined,
        ErrorCode.ADD_ON_INACTIVE,
      );
    }
    if (seenTypes.has(addOn.type)) {
      throw new BadRequestException(
        `Only one ${addOn.type} option can be booked per participant`,
        undefined,
        ErrorCode.ADD_ON_CONFLICT,
      );
    }
    if (
      addOn.capacity !== null &&
      addOn.booked >= addOn.capacity &&
      !options.skipCapacity?.has(id)
    ) {
      throw new BadRequestException(
        `${addOn.name} is fully booked`,
        undefined,
        ErrorCode.ADD_ON_SOLD_OUT,
      );
    }
    seenTypes.add(addOn.type);
    selected.push(addOn);
  }

  return selected;
}

export function toAddOnLines(selected: readonly AddOnCandidate[]): AddOnLine[] {
  return selected.map((a) => ({ addOnId: a.id, price: a.price }));
}

export function sumAddOnLines(lines: readonly AddOnLine[]): number {
  return lines.reduce((sum, line) => sum + line.price, 0);
}

// Spots left, or null when the add-on has no capacity limit.
export function remainingCapacity(
  capacity: number | null,
  booked: number,
): number | null {
  return capacity === null ? null : Math.max(capacity - booked, 0);
}
