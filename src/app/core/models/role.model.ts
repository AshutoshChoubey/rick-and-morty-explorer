export type UserRole = 'ADMIN' | 'VIEWER';

export interface RoleConfig {
  role: UserRole;
  label: string;
  description: string;
  badgeClass: string;
  canViewDetails: boolean;
}

