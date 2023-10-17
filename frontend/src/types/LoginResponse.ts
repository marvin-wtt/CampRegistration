import { User } from 'src/types/User';
import { AccessTokens } from 'src/types/AccessTokens';

export interface LoginResponse {
  user: User;
  tokens: AccessTokens;
}
