import type { Camp } from './Camp';

export interface Profile {
  email: string;
  name: string;
  locale: string;
  camps: Camp[];
}

export type ProfileCreateData = Exclude<Profile, 'id' | 'camps'> & {
  password: string;
};

export type ProfileUpdateData = Partial<ProfileCreateData>;
