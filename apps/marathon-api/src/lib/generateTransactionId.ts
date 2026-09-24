import crypto from 'crypto';

export function generateTransactionId(): string {
  const time = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${time}${rand}`;
}
