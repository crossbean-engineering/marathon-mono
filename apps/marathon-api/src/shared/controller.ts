import { PipeFnCallBack } from '@rabstack/rab-api';
import { checkPermission } from './permissions';

export const accessControlPipe: PipeFnCallBack = (route) =>
  route.permission ? [checkPermission(route.permission)] : [];
