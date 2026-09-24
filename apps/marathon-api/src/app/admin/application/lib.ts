import { Prisma } from '@marathon-api/prisma';
import { BaseUser } from '@marathon/core';

export const UserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  idNumber: true,
  location: true,
  role: true,
  status: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type UserFromDB = Prisma.UserGetPayload<{
  select: typeof UserSelect;
}>;

export function mapUser(row: UserFromDB): BaseUser {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    email: row.email,
    idNumber: row.idNumber,
    location: row.location,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
