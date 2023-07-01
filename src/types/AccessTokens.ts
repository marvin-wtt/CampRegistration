import { Token } from 'src/types/Token';

export interface AccessTokens {
  access: Token;
  refresh?: Token;
}
