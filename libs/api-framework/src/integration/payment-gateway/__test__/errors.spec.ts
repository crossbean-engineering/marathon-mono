import { GatewayCapabilityNotSupportedError } from '../errors';

describe('GatewayCapabilityNotSupportedError', () => {
  it('names the capability and the provider in the message', () => {
    const err = new GatewayCapabilityNotSupportedError('subscriptions', 'legacy');

    expect(err.message).toBe('subscriptions is not supported by the legacy payment gateway.');
    expect(err.capability).toBe('subscriptions');
    expect(err.provider).toBe('legacy');
    expect(err.name).toBe('GatewayCapabilityNotSupportedError');
    expect(err).toBeInstanceOf(Error);
  });

  it.each([
    ['balance', 'legacy'],
    ['payouts', 'legacy'],
    ['verifications', 'legacy'],
    ['subAccounts', 'legacy'],
  ] as const)('reports %s as unsupported by %s', (capability, provider) => {
    const err = new GatewayCapabilityNotSupportedError(capability, provider);
    expect(err.message).toBe(`${capability} is not supported by the ${provider} payment gateway.`);
  });
});
