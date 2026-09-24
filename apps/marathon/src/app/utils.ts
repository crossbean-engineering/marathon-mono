

type UserRole = "user" | "agent" | "admin"

export function getDashboardPath(role: UserRole) {
  return {
    user: "/participant",
    agent: "/agent",
    admin: "/admin",
  }[role];
}

// ─── Ghana phone helpers ─────────────────────────────────────────────────────
// Local part after +233 is exactly 9 digits; mobile prefixes start with 2 or 5.

/** Sanitize raw input into the local 9-digit part: digits only, leading 0 dropped, capped at 9. */
export function normalizeGhPhone(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^0/, '').slice(0, 9);
}

/** True when the local part is a valid Ghana mobile number (9 digits, starts with 2 or 5). */
export function isValidGhPhone(local: string): boolean {
  return /^[25]\d{8}$/.test(local);
}

/** Error message for an invalid local part, or null when valid. */
export function ghPhoneError(local: string): string | null {
  if (!local) return 'Please enter your phone number';
  if (local.length !== 9) return 'Phone number must be 9 digits (without the leading 0)';
  if (!isValidGhPhone(local)) return 'Enter a valid Ghana mobile number (e.g. 24XXXXXXX or 55XXXXXXX)';
  return null;
}

/** Convert a valid local part to the API format 233XXXXXXXXX. */
export function toGhIntlPhone(local: string): string {
  return `233${normalizeGhPhone(local)}`;
}

// ─── Payment verification ────────────────────────────────────────────────────

/**
 * The verify API's terminal status string isn't guaranteed to match the SDK's
 * PaymentStatus enum (the backend may return 'success' rather than
 * 'completed'), so normalise and accept the common variants. Anything that
 * isn't terminal maps to 'pending'.
 */
export function normalizePaymentStatus(
  status: unknown
): 'success' | 'failed' | 'pending' {
  const s = String(status ?? '').toLowerCase();
  if (s === 'completed' || s === 'success' || s === 'successful') {
    return 'success';
  }
  if (s === 'failed' || s === 'cancelled' || s === 'canceled' || s === 'reversed') {
    return 'failed';
  }
  return 'pending';
}
