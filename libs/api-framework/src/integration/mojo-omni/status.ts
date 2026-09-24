import { PaymentStatus, MandateStatus } from '../mojopay/types';

/**
 * 'cancelled' and 'expired' are checkout-session-only (a session left
 * unfinished past its expires_at, or one the payer backed out of via
 * cancel_url) — the doc's unified-verify status enum documents both
 * alongside processing/succeeded/failed.
 */
export type OmniPaymentStatus =
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'expired';
export type OmniMandateStatus =
  | 'processing'
  | 'succeeded'
  | 'cancelled'
  | 'failed';

/**
 * Maps Omni statuses onto the framework's existing PaymentStatus union so
 * consuming apps' database enums do not change. Anything unrecognised maps to
 * 'pending' — an unknown status must never read as money settled.
 *
 * 'cancelled' and 'expired' map to 'failed', not the 'pending' default:
 * PaymentStatus has no distinct terminal state for them, and leaving a dead
 * checkout session as 'pending' means it never resolves — a caller gating on
 * `status !== 'pending'` (VerifyPaymentUseCase, the polling worker) would
 * keep re-querying a session Omni will never move further.
 */
export function mapToPaymentStatus(status: string | undefined): PaymentStatus {
  switch (status) {
    case 'succeeded':
      return 'completed';
    case 'failed':
    case 'cancelled':
    case 'expired':
      return 'failed';
    default:
      return 'pending';
  }
}

export function mapToMandateStatus(status: string | undefined): MandateStatus {
  switch (status) {
    case 'succeeded':
      return 'approved';
    case 'cancelled':
      return 'cancelled';
    case 'failed':
      return 'rejected';
    default:
      return 'pending';
  }
}
