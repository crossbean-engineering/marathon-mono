import { GetGrandParams, PermissionGrant } from 'rab-access';
import { Injectable } from '@rabstack/rab-api';
import { PermissionAbstractBloc } from '../types';
import { AppGeneralPermissionSchema } from './AppGeneralPermissionSchema';

@Injectable()
export class AppAccessControl implements PermissionAbstractBloc {
  execute(params: GetGrandParams): Promise<PermissionGrant> {
    return AppGeneralPermissionSchema.getGrant(params);
  }
}
