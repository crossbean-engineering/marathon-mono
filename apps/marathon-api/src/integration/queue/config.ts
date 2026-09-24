import { QueueOptions } from 'bull';
import { MarathonApiMeta } from '@marathon-api/core';

const paymentBackoffDelays = [
  2 * 60_000,
  5 * 60_000,
  8 * 60_000,
  12 * 60_000,
  20 * 60_000,
  35 * 60_000,
  60 * 60_000,
  2 * 60 * 60_000,
  5 * 60 * 60_000,
  7 * 60 * 60_000,
  10 * 60 * 60_000,
  15 * 60 * 60_000,
];

export const QUEUE_NAMES = {
  PAYMENT_VERIFICATION: 'marathon-payment-verification',
  // Value stays 'marathon-email' so jobs already queued in Redis under the
  // old name keep draining. Renaming it would orphan them.
  NOTIFICATION: 'marathon-email',
} as const;

export const QUEUE_CONFIG = {
  paymentVerification: {
    staleThresholdHours: MarathonApiMeta.paymentStaleThresholdHours,
    backoffDelays: paymentBackoffDelays,
  },
} as const;

export const queueOptions: QueueOptions = {
  redis: {
    host: MarathonApiMeta.redis.host,
    port: MarathonApiMeta.redis.port,
    password: MarathonApiMeta.redis.password || undefined,
    db: MarathonApiMeta.redis.db,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
  },
  settings: {
    backoffStrategies: {
      custom(attemptsMade: number) {
        const i = attemptsMade - 1;
        return (
          paymentBackoffDelays[i] ||
          paymentBackoffDelays[paymentBackoffDelays.length - 1]
        );
      },
    },
  },
};
