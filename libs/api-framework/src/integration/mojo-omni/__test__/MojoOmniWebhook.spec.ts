import { createHmac } from 'crypto';
import { verifyWebhook } from '../MojoOmniWebhook';
import { MojoOmniWebhookError, MojoOmniEventParseError } from '../errors';

const secret = 'whsec_test';

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function sign(timestamp: number, body: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

const collectionEvent = JSON.stringify({
  id: 'EVT_ABCDEFGHIJKLMNOPQRSTUVWX',
  type: 'collection.succeeded',
  data: {
    object: {
      id: 'COL_1',
      status: 'succeeded',
      amount: '1.00',
      fee_amount: '0.02',
      merchant_reference: 'REF-1',
    },
  },
});

describe('verifyWebhook', () => {
  it('accepts a valid t=,v1= signature and normalises the payload', () => {
    const timestamp = nowSeconds();
    const event = verifyWebhook({
      rawBody: collectionEvent,
      signatureHeader: `t=${timestamp},v1=${sign(timestamp, collectionEvent)}`,
      secret,
    });

    expect(event.id).toBe('EVT_ABCDEFGHIJKLMNOPQRSTUVWX');
    expect(event.type).toBe('collection.succeeded');
    if (event.type === 'collection.succeeded') {
      expect(event.data.amount).toBe(100);
      expect(event.data.feeAmount).toBe(2);
      expect(event.data.paymentStatus).toBe('completed');
    }
  });

  it('accepts a Buffer body', () => {
    const timestamp = nowSeconds();
    const event = verifyWebhook({
      rawBody: Buffer.from(collectionEvent, 'utf8'),
      signatureHeader: `t=${timestamp},v1=${sign(timestamp, collectionEvent)}`,
      secret,
    });

    expect(event.type).toBe('collection.succeeded');
  });

  it('accepts a bare hex digest when the timestamp is supplied separately', () => {
    const timestamp = nowSeconds();
    const event = verifyWebhook({
      rawBody: collectionEvent,
      signatureHeader: sign(timestamp, collectionEvent),
      secret,
      timestamp,
    });

    expect(event.type).toBe('collection.succeeded');
  });

  it('accepts any one of several v1 signatures during secret rotation', () => {
    const timestamp = nowSeconds();
    const event = verifyWebhook({
      rawBody: collectionEvent,
      signatureHeader: `t=${timestamp},v1=${'0'.repeat(64)},v1=${sign(
        timestamp,
        collectionEvent,
      )}`,
      secret,
    });

    expect(event.type).toBe('collection.succeeded');
  });

  it('rejects a tampered body', () => {
    const timestamp = nowSeconds();
    const signature = sign(timestamp, collectionEvent);
    const tampered = collectionEvent.replace('"1.00"', '"10000.00"');

    expect(() =>
      verifyWebhook({
        rawBody: tampered,
        signatureHeader: `t=${timestamp},v1=${signature}`,
        secret,
      }),
    ).toThrow(MojoOmniWebhookError);
  });

  it('rejects a wrong secret', () => {
    const timestamp = nowSeconds();

    expect(() =>
      verifyWebhook({
        rawBody: collectionEvent,
        signatureHeader: `t=${timestamp},v1=${sign(timestamp, collectionEvent)}`,
        secret: 'whsec_other',
      }),
    ).toThrow(MojoOmniWebhookError);
  });

  it('rejects a timestamp older than the tolerance', () => {
    const timestamp = nowSeconds() - 301;

    expect(() =>
      verifyWebhook({
        rawBody: collectionEvent,
        signatureHeader: `t=${timestamp},v1=${sign(timestamp, collectionEvent)}`,
        secret,
      }),
    ).toThrow(/timestamp/i);
  });

  it('rejects a timestamp too far in the future', () => {
    const timestamp = nowSeconds() + 301;

    expect(() =>
      verifyWebhook({
        rawBody: collectionEvent,
        signatureHeader: `t=${timestamp},v1=${sign(timestamp, collectionEvent)}`,
        secret,
      }),
    ).toThrow(/timestamp/i);
  });

  it('accepts a timestamp just inside the tolerance', () => {
    const timestamp = nowSeconds() - 299;

    expect(() =>
      verifyWebhook({
        rawBody: collectionEvent,
        signatureHeader: `t=${timestamp},v1=${sign(timestamp, collectionEvent)}`,
        secret,
      }),
    ).not.toThrow();
  });

  it('rejects a malformed header', () => {
    expect(() =>
      verifyWebhook({
        rawBody: collectionEvent,
        signatureHeader: 'garbage',
        secret,
      }),
    ).toThrow(MojoOmniWebhookError);
  });

  it('rejects a bare hex digest with no timestamp', () => {
    expect(() =>
      verifyWebhook({
        rawBody: collectionEvent,
        signatureHeader: '0'.repeat(64),
        secret,
      }),
    ).toThrow(/timestamp/i);
  });

  it.each([
    ['a bare uppercase digest', (ts: number, sig: string) => sig.toUpperCase()],
    ['an uppercase v1 entry', (ts: number, sig: string) => `t=${ts},v1=${sig.toUpperCase()}`],
  ])('accepts %s — hex is case-insensitive and a provider may send it upper', (
    _label,
    buildHeader,
  ) => {
    const timestamp = nowSeconds();
    const signature = sign(timestamp, collectionEvent);

    const event = verifyWebhook({
      rawBody: collectionEvent,
      signatureHeader: buildHeader(timestamp, signature),
      secret,
      timestamp,
    });

    expect(event.type).toBe('collection.succeeded');
  });

  it('truncates the attacker-controlled header before it reaches the logs', () => {
    expect(() =>
      verifyWebhook({
        rawBody: collectionEvent,
        signatureHeader: 'x'.repeat(5000),
        secret,
      }),
    ).toThrow(/^Unrecognised MojoPay-Signature header: x{100}…$/);
  });

  it('reports a non-JSON body as a parse failure, not a signature failure', () => {
    const timestamp = nowSeconds();
    const body = 'not json';

    let thrown: unknown;
    try {
      verifyWebhook({
        rawBody: body,
        signatureHeader: `t=${timestamp},v1=${sign(timestamp, body)}`,
        secret,
      });
    } catch (err) {
      thrown = err;
    }

    // The signature verified, so this is an authentic delivery we cannot read.
    // Answering 400 would tell MojoPay the signature was bad.
    expect(thrown).toBeInstanceOf(MojoOmniEventParseError);
    expect(thrown).not.toBeInstanceOf(MojoOmniWebhookError);
  });

  it('reports an unreadable money field as a parse failure', () => {
    const timestamp = nowSeconds();
    const body = JSON.stringify({
      id: 'EVT_BAD_AMOUNT',
      type: 'collection.succeeded',
      data: { object: { id: 'COL_9', status: 'succeeded', amount: 1020 } },
    });

    let thrown: unknown;
    try {
      verifyWebhook({
        rawBody: body,
        signatureHeader: `t=${timestamp},v1=${sign(timestamp, body)}`,
        secret,
      });
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(MojoOmniEventParseError);
    expect((thrown as Error).message).toMatch(/collection\.succeeded/);
    expect((thrown as Error).message).toMatch(/amount/);
  });

  it('unwraps the resource from data.object, not data itself', () => {
    const timestamp = nowSeconds();
    const event = verifyWebhook({
      rawBody: collectionEvent,
      signatureHeader: `t=${timestamp},v1=${sign(timestamp, collectionEvent)}`,
      secret,
    });

    if (event.type === 'collection.succeeded') {
      expect(event.data.id).toBe('COL_1');
      expect(event.data.merchantReference).toBe('REF-1');
      expect(event.data.status).toBe('succeeded');
    } else {
      throw new Error('expected a collection event');
    }
  });

  it('reports data without an object field as a parse failure', () => {
    const timestamp = nowSeconds();
    const body = JSON.stringify({
      id: 'EVT_NO_OBJECT',
      type: 'collection.succeeded',
      // A flat `data` (no `object` wrapper) is a malformed delivery, not an
      // event with no fields — must not silently map to all-undefined.
      data: { id: 'COL_1', status: 'succeeded' },
    });

    let thrown: unknown;
    try {
      verifyWebhook({
        rawBody: body,
        signatureHeader: `t=${timestamp},v1=${sign(timestamp, body)}`,
        secret,
      });
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(MojoOmniEventParseError);
    expect((thrown as Error).message).toMatch(/no "object" field/);
  });

  it('narrows a mandate event', () => {
    const timestamp = nowSeconds();
    const body = JSON.stringify({
      id: 'EVT_MANDATE',
      type: 'mandate.succeeded',
      data: { object: { mandate_id: 'MND_1', status: 'succeeded' } },
    });

    const event = verifyWebhook({
      rawBody: body,
      signatureHeader: `t=${timestamp},v1=${sign(timestamp, body)}`,
      secret,
    });

    if (event.type === 'mandate.succeeded') {
      expect(event.data.mandateStatus).toBe('approved');
    } else {
      throw new Error('expected a mandate event');
    }
  });

  it('passes payout event payloads through raw', () => {
    const timestamp = nowSeconds();
    const body = JSON.stringify({
      id: 'EVT_PAYOUT',
      type: 'payout.succeeded',
      data: { object: { amount: '5.00', merchant_reference: 'REF-P1' } },
    });

    const event = verifyWebhook({
      rawBody: body,
      signatureHeader: `t=${timestamp},v1=${sign(timestamp, body)}`,
      secret,
    });

    if (event.type === 'payout.succeeded') {
      expect(event.data['amount']).toBe('5.00');
    } else {
      throw new Error('expected a payout event');
    }
  });

  it('rejects an unknown event type rather than guessing', () => {
    const timestamp = nowSeconds();
    const body = JSON.stringify({ id: 'EVT_X', type: 'something.new', data: { object: {} } });

    let thrown: unknown;
    try {
      verifyWebhook({
        rawBody: body,
        signatureHeader: `t=${timestamp},v1=${sign(timestamp, body)}`,
        secret,
      });
    } catch (err) {
      thrown = err;
    }

    expect((thrown as Error).message).toMatch(/unsupported event type/i);
    // An event type MojoPay adds later is a genuine delivery, not a forgery —
    // it must be distinguishable from a failed signature check.
    expect(thrown).toBeInstanceOf(MojoOmniEventParseError);
    expect(thrown).not.toBeInstanceOf(MojoOmniWebhookError);
  });
});
