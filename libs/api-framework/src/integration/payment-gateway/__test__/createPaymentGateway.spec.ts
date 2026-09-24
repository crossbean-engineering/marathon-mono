import { createPaymentGateway } from '../createPaymentGateway';
import { LegacyMojoPayAdapter } from '../LegacyMojoPayAdapter';
import { OmniMojoPayAdapter } from '../OmniMojoPayAdapter';

describe('createPaymentGateway', () => {
  it('returns a LegacyMojoPayAdapter for provider: legacy', () => {
    const gateway = createPaymentGateway({
      provider: 'legacy',
      environment: 'dev',
      credentials: { appId: 'a', apiKey: 'k' },
    });

    expect(gateway).toBeInstanceOf(LegacyMojoPayAdapter);
    expect(gateway.provider).toBe('legacy');
  });

  it('returns an OmniMojoPayAdapter for provider: omni', () => {
    const gateway = createPaymentGateway({
      provider: 'omni',
      environment: 'dev',
      credentials: { clientId: 'c', clientSecret: 's' },
    });

    expect(gateway).toBeInstanceOf(OmniMojoPayAdapter);
    expect(gateway.provider).toBe('omni');
  });
});
