import { UserRole } from './user';

export type BootstrapAdminBody = {
  secret: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
};

export type AddAdminUserBody = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: 'admin' | 'agent';
};

export type ListUsersQuery = {
  role?: UserRole;
};
