import type { User } from '@camp-registration/common/entities';
import { AccessTokens } from 'src/types/AccessTokens';

export interface LoginResponse {
  user: User;
  tokens: AccessTokens;
}
