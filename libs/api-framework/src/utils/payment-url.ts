export type PaymentEnv = 'dev' | 'prod';

type PaymentServiceUrls = {
  mojopay: {
    paymentApiUrl: string;
    invoiceApiUrl: string;
    directDebitBaseUrl: string;
    collectionBaseUrl: string;
    omniBaseUrl: string;
  };
  sycapay: {
    baseUrl: string;
  };
};

type PaymentConfig = {
  urls: Record<PaymentEnv, PaymentServiceUrls>;
};

const config: PaymentConfig = {
  urls: {
    dev: {
      mojopay: {
        paymentApiUrl: 'https://portal.cs-pay.app',
        invoiceApiUrl: 'https://api.cs-pay.app/v1',
        directDebitBaseUrl: 'https://api-dev.cs-pay.app/v3/dd',
        collectionBaseUrl: 'https://glbl-clxn.cspay.app',
        omniBaseUrl: 'https://omni.mojo-pay.com',
      },
      sycapay: {
        baseUrl: 'https://dev.sycapay.net/m-api',
      },
    },
    prod: {
      mojopay: {
        paymentApiUrl: 'https://portal.cs-pay.app',
        invoiceApiUrl: 'https://api.cs-pay.app/v1',
        directDebitBaseUrl: 'https://api.cs-pay.app/v3/dd',
        collectionBaseUrl: 'https://api.cs-pay.app/v3',
        // Omni has no separate sandbox/prod host today — both environments hit
        // the same origin. Kept as its own field (not collapsed into a shared
        // constant) so a future split just changes this one line.
        omniBaseUrl: 'https://omni.mojo-pay.com',
      },
      sycapay: {
        baseUrl: 'https://dev.sycapay.com',
      },
    },
  },
};

type PaymentService = keyof PaymentServiceUrls;

export function getPaymentServiceUrls<T extends PaymentService>(
  service: T,
  env: PaymentEnv,
): PaymentServiceUrls[T] {
  return config.urls[env][service];
}
