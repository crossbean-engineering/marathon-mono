import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@rabstack/rab-api';
import { ErrorCode, Gender } from '@marathon/core';
import { db } from '@marathon-api/core';

// What a registration resolves to before it is settled, whether the buyer is
// paying for it or claiming it free. Shared by BuyPackageUseCase and
// ClaimFreePackageUseCase.
export type PurchaseContext = {
  packageId: string;
  packageName: string;
  price: number;
  customerName: string;
  // retry/claim links an existing participant; new creates one after settling.
  existingParticipantId?: string;
  // set only when switching the participant to a different package.
  switchPackageId?: string;
  // set only when a coupon is applied; price is the discounted (net) amount.
  originalPrice?: number;
  discountAmount?: number;
  couponId?: string;
  couponCode?: string;
};

// The subset of a request body needed to register a new participant. Both
// BuyPackageBody and ClaimFreePackageBody satisfy this.
export type NewParticipantInput = {
  packageId?: string;
  participant?: {
    name: string;
    ic?: string;
    shirtSize?: string;
    gender?: Gender;
  };
};

// New participant: requires packageId + participant, and a free name.
export async function resolveNewParticipant(
  input: NewParticipantInput,
): Promise<PurchaseContext> {
  const { packageId, participant } = input;
  if (!packageId || !participant) {
    throw new BadRequestException(
      'packageId and participant are required to register a new participant',
      undefined,
      ErrorCode.INVALID_INPUT,
    );
  }

  const pkg = await db.package.findUnique({ where: { id: packageId } });
  if (!pkg) {
    throw new NotFoundException('Package not found', ErrorCode.PACKAGE_NOT_FOUND);
  }

  const nameTaken = await db.participant.findUnique({
    where: { name: participant.name },
  });
  if (nameTaken) {
    throw new BadRequestException(
      'Participant name already taken',
      undefined,
      ErrorCode.PARTICIPANT_NAME_TAKEN,
    );
  }

  return {
    packageId: pkg.id,
    packageName: pkg.name,
    price: pkg.price,
    customerName: participant.name,
  };
}

// An existing participant whose registration did not complete. Optionally
// switch to a different package (switchPackageId) — resolves the new price and
// reassigns the participant's package.
export async function resolveExistingParticipant(
  participantId: string,
  userId: string,
  switchPackageId?: string,
): Promise<PurchaseContext> {
  const existing = await db.participant.findUnique({
    where: { id: participantId },
    include: { package: true },
  });
  if (!existing) {
    throw new NotFoundException(
      'Participant not found',
      ErrorCode.PARTICIPANT_NOT_FOUND,
    );
  }
  if (existing.userId !== userId) {
    throw new ForbiddenException(
      'You cannot pay for another user’s participant',
      ErrorCode.FORBIDDEN,
    );
  }
  if (existing.status === 'active') {
    throw new BadRequestException(
      'Participant is already active — payment already completed',
      undefined,
      ErrorCode.PARTICIPANT_ALREADY_ACTIVE,
    );
  }

  // Switch package if a different one was requested.
  if (switchPackageId && switchPackageId !== existing.packageId) {
    const newPkg = await db.package.findUnique({
      where: { id: switchPackageId },
    });
    if (!newPkg) {
      throw new NotFoundException(
        'Package not found',
        ErrorCode.PACKAGE_NOT_FOUND,
      );
    }
    return {
      packageId: newPkg.id,
      packageName: newPkg.name,
      price: newPkg.price,
      customerName: existing.name,
      existingParticipantId: existing.id,
      switchPackageId: newPkg.id,
    };
  }

  return {
    packageId: existing.packageId,
    packageName: existing.package.name,
    price: existing.package.price,
    customerName: existing.name,
    existingParticipantId: existing.id,
  };
}