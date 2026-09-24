import { CorsOptions } from 'cors';
import { MarathonApiMeta } from '@marathon-api/core';

// In production, only allow the configured web app origin(s).
// Outside production, allow any origin.
const PRODUCTION_ALLOWED_ORIGIN = /^https?:\/\/(localhost:4200)$/i;

export const corsOptions: CorsOptions = MarathonApiMeta.isProductionStage
  ? {
      origin: (origin, callback) => {
        // Allow non-browser requests (no Origin header) such as curl/server-to-server.
        if (!origin || PRODUCTION_ALLOWED_ORIGIN.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
    }
  : { origin: '*' };
