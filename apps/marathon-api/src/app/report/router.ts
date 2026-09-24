import { RabApi } from '@rabstack/rab-api';
import { GetStats } from './api/GetStats';
import { GetReports } from './api/GetReports';

export const reportRouter = RabApi.createRouter({
  basePath: '',
  tags: ['Reports'],
  controllers: [GetStats, GetReports],
});
