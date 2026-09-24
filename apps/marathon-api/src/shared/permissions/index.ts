import { PermissionAbstractBloc, TokenPayload } from '../types';
import { ErrorCode } from '@marathon/core';
import { DiContainer, ForbiddenException } from '@rabstack/rab-api';
import { AppAccessControl } from './AppAccessControl';

export const checkPermission = (permission: any) => {
  return async (req: any, res: any, next: any) => {
    const auth = req.auth as TokenPayload;

    if (auth) {
      const accessControl =
        DiContainer.get<PermissionAbstractBloc>(AppAccessControl);
      try {
        if (auth.role) {
          const grant = await accessControl.execute({
            request: req,
            role: auth.role,
            permission,
          });

          if (grant.isAuthorized) {
            req.accessGrant = grant;
            return next();
          } else {
            return next(
              new ForbiddenException('Forbidden: Insufficient permissions'),
            );
          }
        } else {
          return next(
            new ForbiddenException('Role not found', ErrorCode.FORBIDDEN),
          );
        }
      } catch (error) {
        console.log(error);
        return next(
          new ForbiddenException('Forbidden: Insufficient permissions'),
        );
      }
    } else {
      return next(
        new ForbiddenException(
          'Forbidden: Insufficient permissions: no auth found.',
        ),
      );
    }
  };
};
