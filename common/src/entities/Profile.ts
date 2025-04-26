import type { Camp } from './Camp.js';
import type { Permissions } from '#permissions';

interface CampAccess {
  campId: string;
  role: string;
  permissions: Permissions;
}

export interface Profile {
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  twoFactorEnabled: boolean;
  locale: string;
  camps: Camp[];
  campAccess: CampAccess[];
}

export type ProfileUpdateData = Partial<Omit<Profile, 'role' | 'camps'>> & {
  password?: string;
  currentPassword?: string;
};
