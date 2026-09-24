import { RabApi } from '@rabstack/rab-api';
import { Me } from './api/Me';

export const meRouter = RabApi.createRouter({
  basePath: '',
  tags: ['Me'],
  controllers: [Me],
});
