import type { Camp } from './Camp.js';

export interface Profile {
  email: string;
  name: string;
  role: string;
  locale: string;
  camps: Camp[];
}

type PasswordUpdateData = {
  password: string;
  currentPassword: string;
};

export type ProfileUpdateData = Partial<
  Omit<Profile, 'id' | 'camps' | 'role'>
> &
  (never | PasswordUpdateData);
