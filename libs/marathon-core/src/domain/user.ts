export type UserRole = 'user' | 'agent' | 'admin';
export type UserStatus = 'active' | 'suspended';
export type BaseUser = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  idNumber?: string | null;
  location?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};
