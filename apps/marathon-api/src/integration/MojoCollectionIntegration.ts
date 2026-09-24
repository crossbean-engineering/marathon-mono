import { Injectable } from '@rabstack/rab-api';
import {
  MojoCollectionIntegration as BaseMojoCollectionIntegration,
  CollectionInitPaymentRequest,
  CollectionInitPaymentResponse,
  CollectionStatusResponse,
  PaymentStatus,
  MojoPayConfig,
} from '@api/framework';
import { MarathonApiMeta } from '@marathon-api/core';

@Injectable()
export class MojoCollectionIntegration extends BaseMojoCollectionIntegration {
  constructor() {
    super({ environment: MarathonApiMeta.paymentEnv });
  }

  private get config(): MojoPayConfig {
    return {
      appId: MarathonApiMeta.mojo.appId,
      apiKey: MarathonApiMeta.mojo.apiKey,
    };
  }

  initPaymentWithConfig(
    request: CollectionInitPaymentRequest,
  ): Promise<CollectionInitPaymentResponse> {
    return this.initPayment(request, this.config);
  }

  queryStatusWithConfig(
    orderId: string,
  ): Promise<{ response: CollectionStatusResponse; paymentStatus: PaymentStatus }> {
    return this.queryStatus(orderId, this.config);
  }
}
