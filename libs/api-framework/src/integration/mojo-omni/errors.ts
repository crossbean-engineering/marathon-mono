export type MojoOmniApiErrorParams = {
  message: string;
  code: string;
  httpStatus: number;
  requestId?: string;
  docUrl?: string;
};

export class MojoOmniApiError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly requestId?: string;
  readonly docUrl?: string;

  constructor(params: MojoOmniApiErrorParams) {
    super(params.message);
    this.name = 'MojoOmniApiError';
    this.code = params.code;
    this.httpStatus = params.httpStatus;
    this.requestId = params.requestId;
    this.docUrl = params.docUrl;
  }
}

/** Thrown on HTTP 404. Mirrors MandateNotFoundError in the legacy DD client. */
export class MojoOmniNotFoundError extends MojoOmniApiError {
  constructor(params: MojoOmniApiErrorParams) {
    super(params);
    this.name = 'MojoOmniNotFoundError';
  }
}

/**
 * Thrown by verifyWebhook when the delivery cannot be trusted: malformed
 * signature header, bad signature, or a timestamp outside the tolerance.
 * Respond 400 and drop the delivery.
 */
export class MojoOmniWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MojoOmniWebhookError';
  }
}

/**
 * Thrown when a webhook's signature verified but its body could not be
 * understood — an event type this client version does not model, or a payload
 * field in an unexpected shape.
 *
 * Deliberately NOT a subclass of MojoOmniWebhookError: the delivery is
 * authentic, so answering 400 would tell MojoPay the signature was bad, and
 * retrying will never succeed. Acknowledge it and alert instead.
 */
export class MojoOmniEventParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MojoOmniEventParseError';
  }
}

export function isMojoOmniApiError(err: unknown): err is MojoOmniApiError {
  return err instanceof MojoOmniApiError;
}

type ErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    request_id?: string;
    doc_url?: string;
  };
};

export function parseApiError(
  httpStatus: number,
  body: unknown,
  statusText: string,
): MojoOmniApiError {
  const envelope =
    body && typeof body === 'object' ? (body as ErrorEnvelope).error : undefined;

  const params: MojoOmniApiErrorParams = {
    message: envelope?.message || `HTTP ${httpStatus}: ${statusText}`,
    code: envelope?.code || 'unknown_error',
    httpStatus,
    requestId: envelope?.request_id,
    docUrl: envelope?.doc_url,
  };

  return httpStatus === 404
    ? new MojoOmniNotFoundError(params)
    : new MojoOmniApiError(params);
}
