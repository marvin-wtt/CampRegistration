import type { Profile } from './Profile';
import type { AuthTokens } from './AuthTokens';

export interface Authentication {
  user: Profile;
  tokens: AuthTokens;
}

export interface LoginData {
  email: string;
  password: string;
  remember: boolean;
}

export interface RegistrationData {}
