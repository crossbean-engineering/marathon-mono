import { raw, RequestHandler } from 'express';

/**
 * Unparsed application/json body, required by MojoOmniWebhook's HMAC
 * verification (verifyWebhook needs the exact bytes MojoPay signed, not a
 * re-serialized object). Mount on the Omni webhook route ONLY — mounting
 * this globally replaces every other route's parsed req.body with a Buffer.
 */
export function createOmniRawBodyMiddleware(): RequestHandler {
  return raw({ type: 'application/json' });
}
