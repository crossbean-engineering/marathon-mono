import { PaymentEnv, getPaymentServiceUrls } from '../../utils/payment-url';
import { MojoOmniApiError, parseApiError } from './errors';
import { MojoOmniConfig } from './types';

export type MojoOmniClientConfig = {
  environment: PaymentEnv;
  /**
   * Timeout in milliseconds applied to each individual HTTP call, not to the
   * whole `request()`. One request that authenticates, gets a 401,
   * re-authenticates and replays makes four calls. Defaults to 30000.
   */
  timeout?: number;
};

export type MojoOmniRequestOptions = {
  config: MojoOmniConfig;
  body?: unknown;
  query?: Record<string, string | undefined>;
  idempotencyKey?: string;
  /** Set on /v1/metadata/* and /v1/balance, which the API exempts from X-Mojo-Account-Ref. */
  omitAccountRef?: boolean;
};

type CachedToken = { token: string; expiresAt: number };

type OAuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

/** Refresh this many seconds before the token actually expires. */
const TOKEN_SKEW_SECONDS = 60;
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Guards the Idempotency-Key header. The library never generates a key: only
 * the caller knows what counts as "the same request" across a retry, and a
 * generated key would silently turn every retry into a fresh charge.
 */
export function requireIdempotencyKey(key: string): string {
  if (typeof key !== 'string' || key.trim() === '') {
    throw new Error(
      'idempotencyKey is required and must be a non-empty string. Reuse the same key only when retrying the identical request.',
    );
  }
  return key;
}

/**
 * Transport for the MojoPay Omni API. Owns OAuth token caching, headers,
 * one 401 retry, and translation of the error envelope into MojoOmniApiError.
 *
 * Exported as a low-level escape hatch: endpoints this library does not model
 * (payouts, balance) can be called through `request` and still get auth,
 * idempotency and error handling.
 *
 * It deliberately does not use `fetchWithTimeout` — that helper reduces a failed
 * response to a message string, discarding the status code and the body, which
 * would throw away the error `code` and `request_id`.
 */
export class MojoOmniHttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly tokenCache = new Map<string, CachedToken>();

  constructor(config: MojoOmniClientConfig) {
    this.baseUrl = getPaymentServiceUrls('mojopay', config.environment).omniBaseUrl;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  }

  async request<T>(
    method: 'GET' | 'POST',
    path: string,
    options: MojoOmniRequestOptions,
  ): Promise<T> {
    const token = await this.authenticate(options.config);

    try {
      return await this.send<T>(method, path, options, token);
    } catch (err) {
      if (err instanceof MojoOmniApiError && err.httpStatus === 401) {
        // Tokens live 20 minutes; a cached one can expire mid-flight.
        this.tokenCache.delete(this.cacheKey(options.config));
        const refreshed = await this.authenticate(options.config);
        return await this.send<T>(method, path, options, refreshed);
      }
      throw err;
    }
  }

  private cacheKey(config: MojoOmniConfig): string {
    // The secret is part of the key so that a rotated or revoked credential
    // does not keep riding the previous secret's cached token.
    return `${config.clientId}:${config.clientSecret}:${config.accountRef ?? ''}`;
  }

  private async authenticate(config: MojoOmniConfig): Promise<string> {
    const key = this.cacheKey(config);
    const cached = this.tokenCache.get(key);
    if (cached) {
      if (Date.now() / 1000 < cached.expiresAt - TOKEN_SKEW_SECONDS) {
        return cached.token;
      }
      this.tokenCache.delete(key);
    }

    const data = await this.fetchJson<OAuthTokenResponse>(
      `${this.baseUrl}/v1/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }),
      },
    );

    // Only cache when the lifetime is usable. Without this an absent or
    // non-numeric expires_in yields NaN, and `now < NaN - skew` is always
    // false — the entry would sit there forever, never hit, never evicted.
    if (Number.isFinite(data.expires_in) && data.expires_in > 0) {
      this.tokenCache.set(key, {
        token: data.access_token,
        expiresAt: Date.now() / 1000 + data.expires_in,
      });
    }

    return data.access_token;
  }

  private async send<T>(
    method: 'GET' | 'POST',
    path: string,
    options: MojoOmniRequestOptions,
    token: string,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }
    if (options.config.accountRef && !options.omitAccountRef) {
      headers['X-Mojo-Account-Ref'] = options.config.accountRef;
    }

    return await this.fetchJson<T>(url.toString(), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  }

  private async fetchJson<T>(url: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw parseApiError(response.status, body, response.statusText);
      }

      // A successful response with no body (204, or an empty 200) parses to
      // null; hand mappers an empty object so they read absent fields rather
      // than dereferencing null.
      return (body ?? {}) as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
