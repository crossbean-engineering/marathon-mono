import crypto from 'crypto';

// Human-friendly alphabet: no ambiguous 0/O/1/I characters.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Generates a short, readable coupon code, e.g. "WIN-7F3K9Q". Callers should
// check uniqueness against the DB and regenerate on the rare collision.
export function generateCouponCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `WIN-${code}`;
}
