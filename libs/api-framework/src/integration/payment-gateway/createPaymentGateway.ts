import { PaymentEnv } from '../../utils/payment-url';
import { MojoPayConfig } from '../mojopay';
import { MojoOmniConfig } from '../mojo-omni';
import { PaymentGatewayFacade } from './types';
import { LegacyMojoPayAdapter } from './LegacyMojoPayAdapter';
import { OmniMojoPayAdapter } from './OmniMojoPayAdapter';

export type PaymentGatewayFactoryConfig =
  | { provider: 'legacy'; environment: PaymentEnv; credentials: MojoPayConfig }
  | { provider: 'omni'; environment: PaymentEnv; credentials: MojoOmniConfig };

/**
 * The one call an app's use case makes. Nothing downstream should import a
 * concrete adapter, a legacy class, or an Omni class directly — only
 * PaymentGatewayFacade, this function, and whichever Gateway- or Omni-
 * prefixed request types it needs to build a call. See
 * docs/mojo-omni-app-integration-design.md.
 */
export function createPaymentGateway(config: PaymentGatewayFactoryConfig): PaymentGatewayFacade {
  switch (config.provider) {
    case 'legacy':
      return new LegacyMojoPayAdapter(config.environment, config.credentials);
    case 'omni':
      return new OmniMojoPayAdapter(config.environment, config.credentials);
  }
}
