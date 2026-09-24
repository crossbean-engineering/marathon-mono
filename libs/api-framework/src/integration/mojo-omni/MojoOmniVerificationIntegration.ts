import { MojoOmniHttpClient, MojoOmniClientConfig } from './MojoOmniHttpClient';
import { optionalString } from './parse';
import {
  MojoOmniConfig,
  OmniAccountContext,
  OmniVerificationResult,
} from './types';

function toVerificationResult(
  raw: Record<string, unknown>,
): OmniVerificationResult {
  const profile = raw['profile'];
  const hasProfile = profile !== null && typeof profile === 'object';
  const source = hasProfile ? (profile as Record<string, unknown>) : undefined;

  return {
    status: raw['status'] === 'verified' ? 'verified' : 'invalid',
    profile: source
      ? {
          firstName: optionalString(source['first_name']),
          lastName: optionalString(source['last_name']),
        }
      : null,
    raw,
  };
}

function toAccountContext(raw: Record<string, unknown>): OmniAccountContext {
  const merchant = (raw['merchant'] ?? {}) as Record<string, unknown>;
  const account = raw['account'];
  const hasAccount = account !== null && typeof account === 'object';
  const source = hasAccount ? (account as Record<string, unknown>) : undefined;

  return {
    merchant: {
      id: typeof merchant['id'] === 'number' ? merchant['id'] : undefined,
      name: optionalString(merchant['name']),
      subAccountsEnabled:
        typeof merchant['sub_accounts_enabled'] === 'boolean'
          ? merchant['sub_accounts_enabled']
          : undefined,
    },
    account: source
      ? {
          id: optionalString(source['id']) ?? '',
          accountRef: optionalString(source['account_ref']) ?? '',
          name: optionalString(source['name']),
          status: optionalString(source['status']),
        }
      : null,
    raw,
  };
}

export class MojoOmniVerificationIntegration {
  private readonly http: MojoOmniHttpClient;

  constructor(config: MojoOmniClientConfig) {
    this.http = new MojoOmniHttpClient(config);
  }

  async verifyMsisdn(
    params: { mobile: string; provider?: string },
    config: MojoOmniConfig,
  ): Promise<OmniVerificationResult> {
    const raw = await this.http.request<Record<string, unknown>>(
      'POST',
      '/v1/verifications/msisdn',
      { config, body: { mobile: params.mobile, provider: params.provider } },
    );
    return toVerificationResult(raw);
  }

  async verifyBankAccount(
    params: { bankCode: string; accountNumber: string },
    config: MojoOmniConfig,
  ): Promise<OmniVerificationResult> {
    const raw = await this.http.request<Record<string, unknown>>(
      'POST',
      '/v1/verifications/bank_accounts',
      {
        config,
        body: {
          bank_code: params.bankCode,
          account_number: params.accountNumber,
        },
      },
    );
    return toVerificationResult(raw);
  }

  /**
   * Returned raw: the OpenAPI spec gives metadata routes no response schema,
   * so any shape we invented here would break on the first added field.
   */
  async getBanks(config: MojoOmniConfig): Promise<Record<string, unknown>> {
    return await this.http.request<Record<string, unknown>>(
      'GET',
      '/v1/metadata/banks',
      { config, omitAccountRef: true },
    );
  }

  async getMobileProviders(
    config: MojoOmniConfig,
  ): Promise<Record<string, unknown>> {
    return await this.http.request<Record<string, unknown>>(
      'GET',
      '/v1/metadata/mobile_providers',
      { config, omitAccountRef: true },
    );
  }

  async getAccountContext(
    config: MojoOmniConfig,
  ): Promise<OmniAccountContext> {
    const raw = await this.http.request<Record<string, unknown>>(
      'GET',
      '/v1/account',
      { config },
    );
    return toAccountContext(raw);
  }
}
