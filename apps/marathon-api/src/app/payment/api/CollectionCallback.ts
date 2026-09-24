import { Post, RabApiPost, ForbiddenException } from '@rabstack/rab-api';
import { MarathonApis, ErrorCode } from '@marathon/core';
import { ApiSpec } from '@marathon-api/shared';
import { MarathonApiMeta } from '@marathon-api/core';
import { VerifyPaymentUseCase } from '../application';

type ControllerT = ApiSpec<'collectionCallback'>;

@Post(MarathonApis.collectionCallback, {
  isProtected: false,
})
export class CollectionCallback implements RabApiPost<ControllerT> {
  constructor(private verifyPayment: VerifyPaymentUseCase) {}

  handler: ControllerT['request'] = async (request) => {
    if (request.params.trustId !== MarathonApiMeta.paymentTrustId) {
      throw new ForbiddenException('Invalid trust id', ErrorCode.FORBIDDEN);
    }

    const { orderId } = request.body;

    // A webhook only needs an acknowledgement. The polling worker reconciles
    // anything this synchronous verify can't, so a verification error must
    // never fail the ack. The 32-char transactionId we send Mojo as OrderId
    // comes back here as `orderId`, so it is our transactionId.
    try {
      await this.verifyPayment.execute({ transactionId: orderId });
    } catch (error) {
      console.error(
        '[CollectionCallback] verification failed; acknowledging anyway',
        { orderId, error },
      );
    }

    return { received: true };
  };
}
