export type AppStage = 'development' | 'staging' | 'production' | 'local';

export function getAppStage(): AppStage {
  // Vite apps (check first — process is not defined in browser)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const viteEnv = (import.meta as any).env;
    if (viteEnv.DEV) return 'development';
    if (viteEnv.VITE_STAGE === 'staging') return 'staging';
    if (viteEnv.VITE_STAGE === 'production') return 'production';
  }

  // Server-side / Node
  if (typeof process !== 'undefined' && process.env) {

    // Next.js apps
    if (process.env['NEXT_PUBLIC_STAGE']) {
      const stage = process.env['NEXT_PUBLIC_STAGE'];
      if (stage === 'local') return 'local';
      if (stage === 'staging') return 'staging';
      if (stage === 'production') return 'production';
    }

    if (process.env['NODE_ENV'] === 'development' || process.env['IS_OFFLINE']) {
      return 'development';
    }

    // Fallback: check STAGE env var directly
    if (process.env['STAGE'] === 'staging') return 'staging';
    if (process.env['STAGE'] === 'production') return 'production';
  }

  return 'production';
}

type DonationApis = 'donation' | 'gis_bazaar' | 'gift_registry' | 'ak_marathon' | 'donationWebApp' | 'golf';

type ApiConfig = {
  apiUris: Record<
    DonationApis,
    {
      local: string;
      production: string;
      staging: string;
      development: string;
    }
  >;
};


const config: ApiConfig = {
  apiUris: {
    donation: {
      local: 'http://localhost:3000/api',
      production: 'https://contribute-api.mojo-pay.com/api',
      staging: 'https://donation-api-v2.wenovis.com/api',
      development: 'https://donation-api-v2.wenovis.com/api',
    },
    gis_bazaar: {
      local: 'https://gis-bazaar-api.wenovis.com/api',
      production: 'https://gis-bazaar-api.wenovis.com/api',
      staging: 'https://gis-bazaar-api.wenovis.com/api',
      development: 'https://gis-bazaar-api.wenovis.com/api',
    },
    gift_registry: {
      local: 'https://api.gr.mojo-pay.com/api',
      production: 'https://api.gr.mojo-pay.com/api',
      staging: 'https://gift-registry-api.wenovis.com/api',
      development: 'https://api.gr.mojo-pay.com/api',
    },
    ak_marathon: {
      local: 'https://win-registry-api.wenovis.com/api',
      production: 'https://api.arm.mojo-pay.com/api',
      staging: 'https://win-registry-api.wenovis.com/api',
      development: 'https://win-registry-api.wenovis.com/api',
    },
    donationWebApp: {
      local: 'https://contribute.mojo-pay.com',
      production: 'https://contribute.mojo-pay.com',
      staging: 'https://contribute.mojo-pay.com',
      development:'https://contribute.mojo-pay.com',
    },
    golf: {
      local: 'https://golf-api.wenovis.com/api',
      production: 'https://api-golf-app.mojo-pay.com/api',
      staging: 'https://golf-api.wenovis.com/api',
      development: 'https://golf-api.wenovis.com/api',
    },
  },
};

export function getApiUri(api: DonationApis, stage: AppStage = getAppStage()) {
  console.log('getApiUri', stage);
  return config.apiUris[api][stage];
}


