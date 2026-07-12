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

export interface TotpRecoveryCodesData {
  codes: string[];
}

export interface TotpRecoveryCodesGenerateData {
  password: string;
  otp: string;
}
