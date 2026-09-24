import { DiContainer } from '@rabstack/rab-api';
import { QueueService } from '@marathon-api/integration';
import { VerifyPaymentUseCase } from '@marathon-api/app/payment';
import { PaymentVerificationProcessor } from './PaymentVerificationProcessor';

export class PaymentVerificationWorker {
  start(): void {
    const queue = QueueService.getPaymentVerificationQueue();
    const processor = new PaymentVerificationProcessor(
      DiContainer.get(VerifyPaymentUseCase),
    );
    queue.process(async (job) => processor.process(job));
    queue.on('failed', (job, err) =>
      console.error(`[payment-verify] job ${job.id} failed`, err.message),
    );
  }
}
