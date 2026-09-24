import { RabApi, errorHandler } from '@rabstack/rab-api';
import { MarathonApiMeta } from '@marathon-api/core';

const app = RabApi.createApp({
  errorHandler: errorHandler,
  enforceBodyValidation: false,
  auth: {
    jwt: {
      secret_key: MarathonApiMeta.JWT_SECRET_KEY,
      algorithms: MarathonApiMeta.jwtOptions.algorithm,
    },
  },
  openapi: {
    enabled: true,
    info: {
      title: 'Marathon API',
      version: '1.0.0',
      description: 'API documentation for Marathon platform',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
  },
});

export default app;
