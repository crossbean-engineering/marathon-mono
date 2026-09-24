import { IControllerClass } from '@rabstack/rab-api';
import { EndpointSpec } from '@rabstack/rab-api-spec';
import { GetGrandParams, PermissionGrant } from 'rab-access';
import { MarathonApiSpecT, UserRole } from '@marathon/core';

export type TokenPayload = {
  userId: string;
  role: UserRole;
  phone: string;
};

export interface PermissionAbstractBloc {
  execute: (params: GetGrandParams) => Promise<PermissionGrant>;
}

export type ApiSpec<
  T extends keyof MarathonApiSpecT,
  TUser = TokenPayload,
> =
  MarathonApiSpecT[T] extends EndpointSpec<
    infer RESPONSE,
    infer BODY,
    infer QUERY,
    infer PARAMS
  >
    ? IControllerClass<QUERY, BODY, RESPONSE, PARAMS, TUser>
    : never;
