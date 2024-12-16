import type { Profile } from './Profile.js';
import type { AuthTokens } from './AuthTokens.js';

export interface Authentication {
  profile: Profile;
  tokens: AuthTokens;
}

export interface LoginData {
  email: string;
  password: string;
  remember: boolean;
}
