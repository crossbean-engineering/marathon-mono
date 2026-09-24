import { EndpointSpec } from '@rabstack/rab-api-spec';
import { encodeRabQuery } from '@rabstack/rab-query';

export type RequestOptions<BODY = any, QUERY = any, PARAMS = any> = {
  body?: BODY;
  query?: QUERY;
  params?: PARAMS;
};

function buildUrlPath(url: string, params?: Record<string, string>): string {
  if (!params) return url;
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, value),
    url,
  );
}

export function createRequestFn(
  baseUrl: string,
  getToken?: () => string | undefined,
) {
  return async <RESPONSE, BODY = any, QUERY = any, PARAMS = any>(
    endpoint: EndpointSpec<RESPONSE, BODY, QUERY, PARAMS>,
    options: RequestOptions<BODY, QUERY, PARAMS> = {},
  ): Promise<RESPONSE> => {
    const { body, query, params } = options;
    const urlPath = buildUrlPath(endpoint.url, params as any);
    const url = new URL(baseUrl.replace(/\/$/, '') + urlPath);

    if (query) {
      const encoded = encodeRabQuery(query);
      if (encoded) {
        for (const pair of encoded.split('&')) {
          const [key, value] = pair.split('=');
          if (key && value !== undefined) {
            url.searchParams.append(
              decodeURIComponent(key),
              decodeURIComponent(value),
            );
          }
        }
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = getToken?.();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      method: endpoint.method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = (await response.json()) as any;

    if (!response.ok) {
      const error = new Error(json.message || `HTTP ${response.status}`) as any;
      error.status = response.status;
      error.response = json;
      throw error;
    }

    return json.data !== undefined ? json.data : json;
  };
}
