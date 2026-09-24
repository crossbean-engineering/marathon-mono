import { GatewayCapability, PaymentGatewayProvider } from './types';

/**
 * Thrown by the facade layer itself, before either provider is touched, when
 * a caller asks a provider to do something it does not support (e.g. asking
 * legacy MojoPay for a subscription). Callers that want to avoid the
 * try/catch should check PaymentGatewayFacade.supports() first.
 */
export class GatewayCapabilityNotSupportedError extends Error {
  constructor(
    public readonly capability: GatewayCapability,
    public readonly provider: PaymentGatewayProvider,
  ) {
    super(`${capability} is not supported by the ${provider} payment gateway.`);
    this.name = 'GatewayCapabilityNotSupportedError';
  }
}
