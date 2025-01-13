export interface TotpData {
  secret: string;
  url: string;
}

export interface TotpSetupData {
  password: string;
}

export interface TotpEnableData {
  totp: string;
}

export interface TotpDisableData {
  totp: string;
  password: string;
}
