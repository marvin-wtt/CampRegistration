export interface Token {
  token: string;
  expires: string;
}

export interface AuthTokens {
  access: Token;
  refresh?: Token;
}
