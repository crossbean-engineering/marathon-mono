import Bull from 'bull';
import { db, MarathonApiMeta } from '@marathon-api/core';
import {
  NotificationJob,
  NotificationProvider,
  EmailService,
  EmailTemplateService,
  QrCodeService,
  SMSService,
  AccountSetupData,
  PackagePurchaseData,
} from '@marathon-api/integration';

type Outcome = 'sent' | 'skipped';

type Payload =
  | {
      type: 'account-setup';
      email: string | null;
      phone: string | null;
      data: AccountSetupData;
    }
  | {
      type: 'package-purchase';
      email: string | null;
      phone: string | null;
      data: PackagePurchaseData;
    };

const SUBJECTS: Record<Payload['type'], string> = {
  'account-setup': 'Welcome to Western City Run',
  'package-purchase': 'Your Western City Run package is confirmed',
};

export class NotificationProcessor {
  constructor(
    private emailService: EmailService,
    private templateService: EmailTemplateService,
    private smsService: SMSService,
    private qrCodeService: QrCodeService,
  ) {}

  async process(job: Bull.Job<NotificationJob>): Promise<void> {
    const data = job.data;
    const providers: NotificationProvider[] = data.providers?.length
      ? data.providers
      : ['email'];

    const payload = await this.resolve(data);
    if (!payload) return;

    const results = await Promise.allSettled(
      providers.map((provider) => this.dispatch(provider, payload)),
    );

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(
          `[notification] ${payload.type} via ${providers[i]} failed`,
          result.reason,
        );
      }
    });

    const delivered = results.some(
      (r) => r.status === 'fulfilled' && r.value === 'sent',
    );
    // One channel through is enough. Resolving here means a channel that failed
    // alongside a successful one is not retried, because retrying the job would
    // re-send on the channel that already succeeded.
    if (delivered) return;

    const failed = results.some((r) => r.status === 'rejected');
    if (failed) {
      throw new Error(
        `No notification channel delivered for ${payload.type}; retrying`,
      );
    }

    console.warn(
      `[notification] ${payload.type} had no reachable channel; nothing sent`,
    );
  }

  private async dispatch(
    provider: NotificationProvider,
    payload: Payload,
  ): Promise<Outcome> {
    return provider === 'email'
      ? this.sendEmail(payload)
      : this.sendSms(payload);
  }

  private async sendEmail(payload: Payload): Promise<Outcome> {
    if (!payload.email) {
      console.warn(
        `[notification] ${payload.type}: no email address; skipping`,
      );
      return 'skipped';
    }

    const html = await this.templateService.render(payload.type, payload.data);
    const text = this.templateService.renderText(payload.type, payload.data);

    await this.emailService.send(
      payload.email,
      SUBJECTS[payload.type],
      text,
      html,
    );
    console.log(
      `[notification] ${payload.type} email sent to ${payload.email}`,
    );
    return 'sent';
  }

  private async sendSms(payload: Payload): Promise<Outcome> {
    if (!payload.phone) {
      console.warn(`[notification] ${payload.type}: no phone number; skipping`);
      return 'skipped';
    }

    await this.smsService.send(payload.phone, this.smsMessage(payload));
    console.log(`[notification] ${payload.type} sms sent to ${payload.phone}`);
    return 'sent';
  }

  private smsMessage(payload: Payload): string {
    if (payload.type === 'account-setup') {
      return `Hi ${payload.data.firstName}, welcome to Western City Run. Your account is ready.`;
    }

    const d = payload.data;
    return `Hi ${d.participantName}, your ${d.packageName} package is confirmed. ${d.currency} ${d.amount} paid. Your code: ${d.code}. Ref: ${d.transactionId}`;
  }

  private async resolve(data: NotificationJob): Promise<Payload | null> {
    return data.type === 'account-setup'
      ? this.resolveAccountSetup(data.userId)
      : this.resolvePackagePurchase(data.paymentId);
  }

  private async resolveAccountSetup(userId: string): Promise<Payload | null> {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.warn(
        `[notification] user ${userId} not found; skipping account-setup`,
      );
      return null;
    }

    return {
      type: 'account-setup',
      email: user.email,
      phone: user.phone,
      data: { firstName: user.firstName },
    };
  }

  private async resolvePackagePurchase(
    paymentId: string,
  ): Promise<Payload | null> {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        participant: { include: { package: true, user: true } },
        performer: true,
      },
    });
    if (!payment) {
      console.warn(
        `[notification] payment ${paymentId} not found; skipping purchase`,
      );
      return null;
    }

    const participant = payment.participant;
    if (!participant) {
      console.warn(
        `[notification] payment ${paymentId} has no participant; skipping purchase`,
      );
      return null;
    }

    const checkinUrl = `${MarathonApiMeta.webAppUrl.replace(/\/+$/, '')}/checkin/${encodeURIComponent(participant.code)}`;

    return {
      type: 'package-purchase',
      email: payment.email ?? participant.user.email ?? payment.performer.email,
      phone: participant.user.phone ?? payment.performer.phone,
      data: {
        participantName: participant.name,
        packageName: participant.package.name,
        amount: (payment.amount / 100).toFixed(2),
        currency: payment.currency,
        transactionId: payment.transactionId,
        date: (payment.confirmedAt ?? payment.updatedAt)
          .toISOString()
          .slice(0, 10),
        code: participant.code,
        checkinUrl,
        qrDataUrl: await this.qrCodeService.toDataUrl(checkinUrl),
      },
    };
  }
}
