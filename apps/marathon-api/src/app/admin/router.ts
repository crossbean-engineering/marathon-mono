import { RabApi } from '@rabstack/rab-api';
import { Bootstrap } from './api/Bootstrap';
import { AddAdminUser } from './api/AddAdminUser';
import { ListUsers } from './api/ListUsers';

export const adminRouter = RabApi.createRouter({
  basePath: '',
  tags: ['Admin'],
  controllers: [Bootstrap, AddAdminUser, ListUsers],
});
