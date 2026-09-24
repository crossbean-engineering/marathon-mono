import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import app from './boostrapApp';
import { MarathonApiMeta, checkDatabaseConnection } from '@marathon-api/core';
import { ServerHealthCheck } from './shared/ServerHealthCheck';
import { accessControlPipe } from '@marathon-api/shared';
import { corsOptions } from './lib';
import { appRouter } from './app/router';
import { startWorkers } from './workers/start';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(morgan('dev'));

app.route({
  pipes: [accessControlPipe],
  basePath: '/api',
  controllers: [appRouter, ServerHealthCheck],
});

const port = MarathonApiMeta.port;
checkDatabaseConnection().then(() => {
  const server = app.listen(port, async () => {
    console.log(
      `[marathon-api] v${MarathonApiMeta.appVersion} | ${MarathonApiMeta.environment} | http://localhost:${port}/api/`,
    );
    await startWorkers();
  });
  server.on('error', console.error);
});
