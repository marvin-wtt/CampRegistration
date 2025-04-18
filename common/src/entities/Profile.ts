import type { Camp } from './Camp.js';

export interface Profile {
  email: string;
  name: string;
  role: string;
  twoFactorEnabled: boolean;
  locale: string;
  camps: Camp[];
}

export type ProfileUpdateData = Partial<Omit<Profile, 'role' | 'camps'>> & {
  password?: string;
  currentPassword?: string;
};
