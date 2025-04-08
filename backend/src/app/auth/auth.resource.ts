import type {
  Authentication as AuthenticationResourceData,
  Token,
} from '@camp-registration/common/entities';
import type { AuthTokensResponse, TokenResponse } from '#types/response';
import {
  ProfileResource,
  type UserWithCamps,
} from '#app/profile/profile.resource.js';
import { JsonResource } from '#core/resource/JsonResource.js';

interface AuthWithData {
  user: UserWithCamps;
  tokens: AuthTokensResponse;
}

export class AuthResource extends JsonResource<
  AuthWithData,
  AuthenticationResourceData
> {
  transform(): AuthenticationResourceData {
    return {
      profile: new ProfileResource(this.data.user).transform(),
      tokens: {
        access: convertToken(this.data.tokens.access),
        refresh: this.data.tokens.refresh
          ? convertToken(this.data.tokens.refresh)
          : undefined,
      },
    };
  }
}

const convertToken = (token: TokenResponse): Token => {
  return {
    token: token.token,
    expires: token.expires.toUTCString(),
  };
};
