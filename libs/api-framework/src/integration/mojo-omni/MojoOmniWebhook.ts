import { createHmac, timingSafeEqual } from 'crypto';
import { MojoOmniWebhookError, MojoOmniEventParseError } from './errors';
import { toOmniCollection } from './MojoOmniCollectionIntegration';
import { toOmniCheckoutSession } from './MojoOmniCheckoutIntegration';
import {
  toOmniMandate,
  toOmniMandateDebit,
  toOmniSubscription,
} from './MojoOmniMandateIntegration';
import {
  OmniCheckoutSession,
  OmniCollection,
  OmniMandate,
  OmniMandateDebit,
  OmniSubscription,
} from './types';

const DEFAULT_TOLERANCE_SECONDS = 300;

export type OmniCollectionEventType =
  | 'collection.processing'
  | 'collection.succeeded'
  | 'collection.failed';

export type OmniCheckoutEventType =
  | 'checkout_session.processing'
  | 'checkout_session.succeeded'
  | 'checkout_session.failed';

export type OmniPayoutEventType =
  | 'payout.processing'
  | 'payout.succeeded'
  | 'payout.failed';

export type OmniMandateEventType =
  | 'mandate.processing'
  | 'mandate.succeeded'
  | 'mandate.cancelled';

export type OmniMandateDebitEventType =
  | 'mandate_debit.processing'
  | 'mandate_debit.succeeded'
  | 'mandate_debit.failed';

export type OmniSubscriptionEventType =
  | 'subscription.created'
  | 'subscription.active'
  | 'subscription.cancelled'
  | 'subscription.failed'
  | 'subscription.charge_failed';

export type OmniEventType =
  | OmniCollectionEventType
  | OmniCheckoutEventType
  | OmniPayoutEventType
  | OmniMandateEventType
  | OmniMandateDebitEventType
  | OmniSubscriptionEventType;

export type MojoOmniEvent =
  | { id: string; type: OmniCollectionEventType; data: OmniCollection }
  | { id: string; type: OmniCheckoutEventType; data: OmniCheckoutSession }
  | { id: string; type: OmniPayoutEventType; data: Record<string, unknown> }
  | { id: string; type: OmniMandateEventType; data: OmniMandate }
  | { id: string; type: OmniMandateDebitEventType; data: OmniMandateDebit }
  | { id: string; type: OmniSubscriptionEventType; data: OmniSubscription };

const COLLECTION_EVENTS: OmniCollectionEventType[] = [
  'collection.processing',
  'collection.succeeded',
  'collection.failed',
];
const CHECKOUT_EVENTS: OmniCheckoutEventType[] = [
  'checkout_session.processing',
  'checkout_session.succeeded',
  'checkout_session.failed',
];
const PAYOUT_EVENTS: OmniPayoutEventType[] = [
  'payout.processing',
  'payout.succeeded',
  'payout.failed',
];
const MANDATE_EVENTS: OmniMandateEventType[] = [
  'mandate.processing',
  'mandate.succeeded',
  'mandate.cancelled',
];
const MANDATE_DEBIT_EVENTS: OmniMandateDebitEventType[] = [
  'mandate_debit.processing',
  'mandate_debit.succeeded',
  'mandate_debit.failed',
];
const SUBSCRIPTION_EVENTS: OmniSubscriptionEventType[] = [
  'subscription.created',
  'subscription.active',
  'subscription.cancelled',
  'subscription.failed',
  'subscription.charge_failed',
];

type ParsedSignature = { timestamp: number; signatures: string[] };

/**
 * The OpenAPI spec documents what the signature covers ("{timestamp}.{raw_body}")
 * but not the MojoPay-Signature header's format. Both plausible shapes are
 * accepted until a real delivery confirms which one MojoPay sends:
 *   1. "t=<unix-seconds>,v1=<hex>"  (possibly several v1 entries during rotation)
 *   2. a bare hex digest, with the timestamp passed in separately by the caller
 */
function parseSignatureHeader(
  header: string,
  fallbackTimestamp?: number | string,
): ParsedSignature {
  const trimmed = typeof header === 'string' ? header.trim() : '';

  if (/^[a-f0-9]{64}$/i.test(trimmed)) {
    if (fallbackTimestamp === undefined) {
      throw new MojoOmniWebhookError(
        'MojoPay-Signature is a bare digest, so a timestamp must be supplied separately.',
      );
    }
    const timestamp = Number(fallbackTimestamp);
    if (!Number.isFinite(timestamp)) {
      throw new MojoOmniWebhookError(
        `Invalid webhook timestamp: ${String(fallbackTimestamp)}`,
      );
    }
    return { timestamp, signatures: [trimmed] };
  }

  let timestamp: number | undefined;
  const signatures: string[] = [];

  for (const part of trimmed.split(',')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key === 't') timestamp = Number(value);
    else if (key === 'v1') signatures.push(value);
  }

  if (
    timestamp === undefined ||
    !Number.isFinite(timestamp) ||
    signatures.length === 0
  ) {
    // Truncated: the header is attacker-controlled and ends up in app logs.
    throw new MojoOmniWebhookError(
      `Unrecognised MojoPay-Signature header: ${truncateForLog(header)}`,
    );
  }

  return { timestamp, signatures };
}

function truncateForLog(value: string): string {
  const text = typeof value === 'string' ? value : String(value);
  return text.length > 100 ? `${text.slice(0, 100)}…` : text;
}

function safeEqual(a: string, b: string): boolean {
  // Hex digests are case-insensitive and Node emits lowercase; a provider
  // sending uppercase must not read as a forgery. Case-fold before comparing,
  // then compare in constant time.
  const bufferA = Buffer.from(a.toLowerCase(), 'utf8');
  const bufferB = Buffer.from(b.toLowerCase(), 'utf8');
  // timingSafeEqual throws on a length mismatch, so compare lengths first.
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

function toEvent(
  id: string,
  type: string,
  data: Record<string, unknown>,
): MojoOmniEvent {
  if (COLLECTION_EVENTS.includes(type as OmniCollectionEventType)) {
    return {
      id,
      type: type as OmniCollectionEventType,
      data: toOmniCollection(data),
    };
  }
  if (CHECKOUT_EVENTS.includes(type as OmniCheckoutEventType)) {
    return {
      id,
      type: type as OmniCheckoutEventType,
      data: toOmniCheckoutSession(data),
    };
  }
  if (PAYOUT_EVENTS.includes(type as OmniPayoutEventType)) {
    // Payouts are not modelled by this library; the payload passes through raw.
    return { id, type: type as OmniPayoutEventType, data };
  }
  if (MANDATE_EVENTS.includes(type as OmniMandateEventType)) {
    return { id, type: type as OmniMandateEventType, data: toOmniMandate(data) };
  }
  if (MANDATE_DEBIT_EVENTS.includes(type as OmniMandateDebitEventType)) {
    return {
      id,
      type: type as OmniMandateDebitEventType,
      data: toOmniMandateDebit(data),
    };
  }
  if (SUBSCRIPTION_EVENTS.includes(type as OmniSubscriptionEventType)) {
    return {
      id,
      type: type as OmniSubscriptionEventType,
      data: toOmniSubscription(data),
    };
  }

  throw new MojoOmniEventParseError(
    `Unsupported event type: ${truncateForLog(type)}. The signature verified, so this is a genuine MojoPay delivery this client version does not model.`,
  );
}

/**
 * Verifies a MojoPay Omni webhook and returns the parsed event.
 *
 * Requires the UNPARSED request body — mount express.raw() on the webhook route,
 * not the JSON body parser, or the signature will never match.
 *
 * Throws MojoOmniWebhookError rather than returning a boolean, so a caller
 * cannot forget to check the result.
 */
export function verifyWebhook(params: {
  rawBody: string | Buffer;
  signatureHeader: string;
  secret: string;
  /** Only needed when signatureHeader is a bare hex digest. */
  timestamp?: number | string;
  toleranceSeconds?: number;
}): MojoOmniEvent {
  const tolerance = params.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  const body =
    typeof params.rawBody === 'string'
      ? params.rawBody
      : params.rawBody.toString('utf8');

  const { timestamp, signatures } = parseSignatureHeader(
    params.signatureHeader,
    params.timestamp,
  );

  const skew = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (skew > tolerance) {
    throw new MojoOmniWebhookError(
      `Webhook timestamp is ${skew}s away from now, outside the ${tolerance}s tolerance.`,
    );
  }

  const expected = createHmac('sha256', params.secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  if (!signatures.some((signature) => safeEqual(signature, expected))) {
    throw new MojoOmniWebhookError('Webhook signature verification failed.');
  }

  // Everything past this point runs on a body whose signature has verified, so
  // failures here are MojoOmniEventParseError, not MojoOmniWebhookError.
  let parsed: { id?: unknown; type?: unknown; data?: unknown };
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new MojoOmniEventParseError('Webhook body is not valid JSON.');
  }

  if (typeof parsed.type !== 'string') {
    throw new MojoOmniEventParseError('Webhook body has no event type.');
  }

  // The envelope wraps the resource one level deeper than `data` itself:
  // { data: { object: { id, status, ... } } }. A `data` present without an
  // `object` is a malformed delivery, not "no fields" — every mapped field
  // (id, status, amount...) would otherwise silently come back undefined
  // instead of surfacing as a parse failure.
  const envelopeData =
    parsed.data && typeof parsed.data === 'object'
      ? (parsed.data as Record<string, unknown>)
      : undefined;
  const resourceObject = envelopeData?.['object'];
  if (envelopeData !== undefined && (resourceObject === null || typeof resourceObject !== 'object')) {
    throw new MojoOmniEventParseError(
      `Webhook body's data has no "object" field. Received keys: ${Object.keys(envelopeData).join(', ') || '(none)'}`,
    );
  }
  const data = (resourceObject as Record<string, unknown> | undefined) ?? {};

  try {
    return toEvent(
      typeof parsed.id === 'string' ? parsed.id : '',
      parsed.type,
      data,
    );
  } catch (err) {
    if (err instanceof MojoOmniEventParseError) throw err;
    // A mapper rejected the payload (e.g. an unreadable money field). The
    // delivery is authentic, so surface it as a parse failure.
    throw new MojoOmniEventParseError(
      `Could not map ${truncateForLog(parsed.type)} payload: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}
