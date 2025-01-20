import type {
  Authentication as AuthenticationResource,
  Profile,
  Token,
} from '@camp-registration/common/entities';
import { AuthTokensResponse, TokenResponse } from '#types/response';

export const authResource = (
  profile: Profile,
  tokens: AuthTokensResponse,
): AuthenticationResource => {
  return {
    profile,
    tokens: {
      access: convertToken(tokens.access),
      refresh: tokens.refresh ? convertToken(tokens.refresh) : undefined,
    },
  };
};

const convertToken = (token: TokenResponse): Token => {
  return {
    token: token.token,
    expires: token.expires.toUTCString(),
  };
};

export default authResource;
