import type { Camp } from './Camp.js';

export interface Profile {
  email: string;
  name: string;
  role: string;
  locale: string;
  camps: Camp[];
}

type PasswordUpdateData =
  | { password: string; currentPassword: string }
  | { password?: undefined; currentPassword?: undefined };

export type ProfileUpdateData = Partial<Omit<Profile, 'camps' | 'role'>> &
  PasswordUpdateData;
