export type AppAccessRole = 'user' | 'agent' | 'admin';

export const AppRoles: Record<AppAccessRole, AppAccessRole> = {
  user: 'user',
  agent: 'agent',
  admin: 'admin',
};
