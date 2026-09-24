import * as process from 'node:process';

export const MarathonApiMeta = {
  appVersion: process.env['APP_VERSION'] || 'unset',
  commitSha: process.env['COMMIT_SHA'] || 'unset',
  environment: process.env['NODE_ENV'] || 'development',
  isProduction: process.env['NODE_ENV'] === 'production',
  isDevelopment: process.env['NODE_ENV'] === 'development',
  isProductionStage: process.env['STAGE']
    ? process.env['STAGE'] === 'production'
    : true,
  port: process.env['PORT'] || 3000,
  JWT_SECRET_KEY: process.env['JWT_SECRET_KEY'] ?? '',
  jwtOptions: {
    expiresIn: 60 * 60 * 24 * 7,
    algorithm: 'HS256' as any,
  },
  databaseUrl: process.env['MARATHON_DATABASE_URL'] ?? '',
  webAppUrl: process.env['WEB_APP_URL'] ?? 'http://localhost:4200',
  adminSecretKey: process.env['ADMIN_SECRET_KEY'] ?? '',
  superAdminPhone: process.env['MARATHON_SUPER_ADMIN_PHONE'] ?? '',
  paymentEnv: (process.env['PAYMENT_ENV'] as 'dev' | 'prod') || 'prod',
  paymentStaleThresholdHours: parseInt(process.env['PAYMENT_STALE_THRESHOLD_HOURS'] || '24'),
  paymentTrustId: process.env['PAYMENT_TRUST_ID'] || 'win-pc-2f8a1b4e',
  mojo: {
    appId: process.env['MOJO_APP_ID'] ?? '',
    apiKey: process.env['MOJO_APP_KEY'] ?? '',
  },
  smtp: {
    host: process.env['SMTP_HOST'] ?? '',
    port: parseInt(process.env['SMTP_PORT'] || '587'),
    user: process.env['SMTP_USER'] ?? '',
    password: process.env['SMTP_PASSWORD'] ?? '',
    // Address must match SMTP_USER unless the relay grants send-as rights.
    // Empty falls back to SMTP_USER in SMTPIntegration.
    from: process.env['EMAIL_FROM'] ?? '',
  },
  hubtel: {
    clientId: process.env['HUBTEL_CLIENT_ID'] ?? '',
    clientSecret: process.env['HUBTEL_CLIENT_SECRET'] ?? '',
    from: process.env['HUBTEL_FROM'] ?? '',
  },
  redis: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379'),
    password: process.env['REDIS_PASSWORD'],
    db: parseInt(process.env['REDIS_DB'] || '0'),
  },
};
