import { MarathonSpecs, MarathonApiSpecT } from '@marathon/core';
import { EndpointSpec } from '@rabstack/rab-api-spec';
import { createRequestFn, RequestOptions } from './requestFn';

type SdkMethods<T extends Record<string, EndpointSpec<any, any, any, any>>> = {
  [K in keyof T]: T[K] extends EndpointSpec<infer R, infer B, infer Q, infer P>
    ? (options?: RequestOptions<B, Q, P>) => Promise<R>
    : never;
};

export type MarathonSDK = SdkMethods<MarathonApiSpecT>;

export function createSDK(
  baseUrl: string,
  getToken?: () => string | undefined,
): MarathonSDK {
  const request = createRequestFn(baseUrl, getToken);
  const sdk: Record<string, any> = {};

  for (const [key, endpoint] of Object.entries(MarathonSpecs)) {
    sdk[key] = (options: RequestOptions = {}) => request(endpoint, options);
  }

  return sdk as MarathonSDK;
}
