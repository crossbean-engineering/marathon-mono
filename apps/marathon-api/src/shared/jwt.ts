import * as jwt from 'jsonwebtoken';
import { MarathonApiMeta } from '@marathon-api/core';
import { TokenPayload } from './types';

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, MarathonApiMeta.JWT_SECRET_KEY, {
    expiresIn: MarathonApiMeta.jwtOptions.expiresIn,
    algorithm: MarathonApiMeta.jwtOptions.algorithm,
  });
}
