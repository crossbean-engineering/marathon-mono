import { PackageSummary } from './package';
import { ParticipantAddOnSummary } from './addOn';

// A merchandise item this participant has actually collected. `collectedAt` is
// the moment it was first handed over and is preserved across later updates.
export type CollectedMerchandise = {
  merchandiseId: string;
  name: string;
  description?: string | null;
  collectedAt: string;
};

export type Gender = 'male' | 'female';
export type ParticipantStatus = 'pending' | 'active' | 'suspended';

export type BaseParticipant = {
  id: string;
  name: string;
  code: string;
  ic?: string | null;
  shirtSize?: string | null;
  gender?: Gender | null;
  status: ParticipantStatus;
  // Set at check-in. Null on both until the participant has checked in.
  runnerNumber?: string | null;
  checkinDate?: string | null;
  packageId: string;
  // Basic info of the package this participant bought into. Populated only when
  // the caller includes the package relation (e.g. the `me` endpoint).
  package?: PackageSummary | null;
  // Populated only when the caller includes the relation (e.g. getParticipant).
  collectedMerchandise?: CollectedMerchandise[];
  // Weekend Package add-ons booked with this registration. Populated only when
  // the caller includes the relation (e.g. me, getParticipant).
  addOns?: ParticipantAddOnSummary[];
  userId: string;
  wristbandCode?: string | null;
  createdAt: string;
};

export type BuyPackageBody = {
  // New participant: provide packageId + participant. Retry a failed payment
  // for an existing participant: provide participantId instead (exactly one of
  // participant / participantId).
  packageId?: string;
  participant?: {
    name: string;
    ic?: string;
    shirtSize?: string;
    gender?: Gender;
  };
  participantId?: string;
  // Weekend Package add-ons (at most one per type). On a retry, omit to keep
  // the participant's existing add-ons, or pass the full new set (even []).
  addOnIds?: string[];
  payment: {
    momoNumber: string;
    network: 'MTN' | 'VODAFONE' | 'AIRTELTIGO';
    email?: string;
  };
  // Payment safety layer (mirrors gift-registry Contribute):
  // OTP-verify the paying momo number, then reuse a session token to skip re-OTP,
  // and dedup retries with an idempotency key.
  otp?: string;
  otpSessionId?: string;
  sessionToken?: string;
  idempotencyKey?: string;
  // Optional promo code. When valid for the resolved package, the charge is
  // reduced by the coupon's percentage.
  couponCode?: string;
};

export type BuyPackageResponse = {
  participant: BaseParticipant;
  payment: {
    orderId: string;
    transactionId: string;
    status: 'pending';
    // Present only when a coupon was applied.
    originalAmount?: number; // pre-discount price, pesewas
    discountAmount?: number; // amount taken off, pesewas
    // Present only when add-ons were booked; included in the charged amount.
    addOnAmount?: number; // pesewas
  };
  // Issued/echoed after OTP verification; reuse within its window to skip re-OTP.
  sessionToken?: string;
};

// Register a participant with a coupon that covers the whole package price.
// Nothing is charged, so there is no payment block and no OTP: the settlement
// is recorded as a `waived` payment of 0 and the participant goes straight to
// active. A coupon that leaves any balance is rejected — that goes to
// /participants/buy — as does a participant with paid add-ons booked, since
// coupons cover the race package only. Exactly one of participant /
// participantId, as with BuyPackageBody.
export type ClaimFreePackageBody = {
  packageId?: string;
  participant?: {
    name: string;
    ic?: string;
    shirtSize?: string;
    gender?: Gender;
  };
  participantId?: string;
  couponCode: string;
  idempotencyKey?: string;
};

export type ClaimFreePackageResponse = {
  participant: BaseParticipant;
  payment: {
    orderId: string;
    transactionId: string;
    status: 'completed';
    originalAmount: number; // package price before the coupon, pesewas
    discountAmount: number; // equals originalAmount — the whole price was waived
  };
};

// Check a participant in at the event: assign their race number and record the
// shirt size issued. Admin/agent only.
export type CheckInParticipantBody = {
  runnerNumber: string;
  shirtSize?: string;
};

// Set which merchandise a participant has collected. `merchandiseIds` is the
// FINAL state, not a delta: ids not yet recorded are added, recorded ids left
// out are removed, and ids already recorded are untouched (keeping their
// original collectedAt). Send an empty array to clear everything.
export type SetCollectedMerchandiseBody = {
  merchandiseIds: string[];
};

export type SetCollectedMerchandiseResponse = {
  participantId: string;
  collected: CollectedMerchandise[];
  // What this call actually changed, as merchandise ids.
  added: string[];
  removed: string[];
  unchanged: string[];
};

export type ListParticipantsQuery = {
  packageId?: string;
  status?: ParticipantStatus;
  code?: string;
  userId?: string;
  wristbandCode?: string;
  gender?: Gender;
  shirtSize?: string;
  addOnId?: string; // participants who booked this add-on
};
