export interface TotpData {
  secret: string;
  url: string;
}

export interface TotpSetupData {
  password: string;
}

export interface TotpEnableData {
  otp: string;
}

export interface TotpDisableData {
  otp: string;
  password: string;
}
