import { createSDK } from '../kit';

// This is an end-to-end smoke test. It only runs when MARATHON_BASE_URL is
// set (pointing at a running marathon-api), otherwise it is skipped so the
// suite passes without external services.
const BASE_URL = process.env['MARATHON_BASE_URL'];
const describeE2E = BASE_URL ? describe : describe.skip;

describeE2E('GET /health-check', () => {
  const sdk = createSDK(BASE_URL || 'http://localhost:3000/api');

  it('returns a healthy status payload', async () => {
    const health = await sdk.healthCheck();

    expect(health.message).toBeDefined();
    expect(health.environment).toBeDefined();
    expect(health.version).toBeDefined();
  });
});
