import {
  MojoOmniApiError,
  MojoOmniNotFoundError,
  isMojoOmniApiError,
  parseApiError,
} from '../errors';

describe('parseApiError', () => {
  it('reads every field out of the error envelope', () => {
    const err = parseApiError(
      400,
      {
        error: {
          code: 'invalid_parameter',
          message: 'amount is required',
          request_id: 'REQ_8F3A2C1B9D0E',
          doc_url: 'https://omni.mojo-pay.com/doc#amounts',
        },
      },
      'Bad Request',
    );

    expect(err).toBeInstanceOf(MojoOmniApiError);
    expect(err.code).toBe('invalid_parameter');
    expect(err.message).toBe('amount is required');
    expect(err.requestId).toBe('REQ_8F3A2C1B9D0E');
    expect(err.docUrl).toBe('https://omni.mojo-pay.com/doc#amounts');
    expect(err.httpStatus).toBe(400);
  });

  it('falls back when the body is not an envelope', () => {
    const err = parseApiError(502, null, 'Bad Gateway');

    expect(err.code).toBe('unknown_error');
    expect(err.message).toBe('HTTP 502: Bad Gateway');
    expect(err.httpStatus).toBe(502);
    expect(err.requestId).toBeUndefined();
  });

  it('falls back when the body is an unrelated JSON shape', () => {
    const err = parseApiError(500, { detail: 'boom' }, 'Internal Server Error');

    expect(err.code).toBe('unknown_error');
    expect(err.httpStatus).toBe(500);
  });

  it('produces a MojoOmniNotFoundError on 404 so callers can tell "absent" from "broken"', () => {
    const err = parseApiError(
      404,
      {
        error: {
          code: 'not_found',
          message: 'No such collection',
          request_id: 'REQ_ABCDEF123456',
        },
      },
      'Not Found',
    );

    expect(err).toBeInstanceOf(MojoOmniNotFoundError);
    expect(err).toBeInstanceOf(MojoOmniApiError);
    expect(err.code).toBe('not_found');
  });

  it('preserves the rate_limited code so callers can back off', () => {
    const err = parseApiError(
      429,
      {
        error: {
          code: 'rate_limited',
          message: 'Too many requests',
          request_id: 'REQ_111111111111',
        },
      },
      'Too Many Requests',
    );

    expect(err.code).toBe('rate_limited');
    expect(err.httpStatus).toBe(429);
  });
});

describe('isMojoOmniApiError', () => {
  it('narrows a MojoOmniApiError', () => {
    expect(isMojoOmniApiError(parseApiError(400, null, 'Bad Request'))).toBe(true);
  });

  it('rejects a plain Error', () => {
    expect(isMojoOmniApiError(new Error('nope'))).toBe(false);
  });
});
