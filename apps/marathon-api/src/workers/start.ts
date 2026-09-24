import { QueueService } from '@marathon-api/integration';
import { PaymentVerificationWorker } from './PaymentVerificationWorker';
import { NotificationWorker } from './notification/NotificationWorker';

export async function startWorkers(): Promise<void> {
  QueueService.initialize();
  new PaymentVerificationWorker().start();
  new NotificationWorker().start();
  process.on('SIGTERM', async () => {
    await QueueService.shutdown();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    await QueueService.shutdown();
    process.exit(0);
  });
}
