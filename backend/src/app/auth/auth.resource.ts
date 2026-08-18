import type {
  Authentication as AuthenticationResource,
  Token,
} from '@camp-registration/common/entities';
import type { AuthTokensResponse, TokenResponse } from '#types/response';
import { ProfileResource } from '#app/profile/profile.resource';
import type { ProfileUser } from '#app/profile/profile.types';

interface AuthWithData {
  user: ProfileUser;
  tokens: AuthTokensResponse;
}

export const authResource = (data: AuthWithData): AuthenticationResource => {
  return {
    profile: new ProfileResource(data.user).transform(),
    tokens: {
      access: convertToken(data.tokens.access),
      refresh: data.tokens.refresh
        ? convertToken(data.tokens.refresh)
        : undefined,
    },
  };
};

const convertToken = (token: TokenResponse): Token => {
  return {
    token: token.token,
    expires: token.expires.toISOString(),
  };
};

export default authResource;
