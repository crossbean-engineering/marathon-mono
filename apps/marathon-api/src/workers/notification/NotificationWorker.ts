import { DiContainer } from '@rabstack/rab-api';
import {
  QueueService,
  EmailService,
  EmailTemplateService,
  QrCodeService,
  SMSService,
} from '@marathon-api/integration';
import { NotificationProcessor } from './NotificationProcessor';

export class NotificationWorker {
  start(): void {
    const queue = QueueService.getNotificationQueue();
    const processor = new NotificationProcessor(
      DiContainer.get(EmailService),
      DiContainer.get(EmailTemplateService),
      DiContainer.get(SMSService),
      DiContainer.get(QrCodeService),
    );
    queue.process(async (job) => processor.process(job));
    queue.on('completed', (job) =>
      console.log(`[notification] job ${job.id} completed`),
    );
    queue.on('failed', (job, err) =>
      console.error(`[notification] job ${job.id} failed`, err.message),
    );
    console.log('✅ Notification worker started');
  }
}
