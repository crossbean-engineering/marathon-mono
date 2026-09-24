import { RabApi } from '@rabstack/rab-api';
import { SignUp } from './api/SignUp';
import { Login } from './api/Login';

export const authRouter = RabApi.createRouter({
  basePath: '',
  tags: ['Auth'],
  controllers: [SignUp, Login],
});
