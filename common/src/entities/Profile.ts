import type { Camp } from './Camp';

export interface Profile {
  email: string;
  name: string;
  role: string;
  locale: string;
  camps: Camp[];
}

export type ProfileCreateData = Omit<Profile, 'id' | 'camps' | 'role'> & {
  password: string;
};

export type ProfileUpdateData = Partial<ProfileCreateData>;
