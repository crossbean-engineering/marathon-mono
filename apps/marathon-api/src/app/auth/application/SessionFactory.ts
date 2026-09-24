import { Injectable } from '@rabstack/rab-api';
import { AuthResponse, BaseUser } from '@marathon/core';
import { signToken } from '@marathon-api/shared';

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  idNumber: string | null;
  location: string | null;
  role: BaseUser['role'];
  status: BaseUser['status'];
  createdAt: Date;
};

@Injectable()
export class SessionFactory {
  build(user: UserRow): AuthResponse {
    const accessToken = signToken({
      userId: user.id,
      role: user.role,
      phone: user.phone,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        idNumber: user.idNumber,
        location: user.location,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }
}
