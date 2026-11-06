export interface Passkey {
  id: string;
  name: string;
  /** `multiDevice` passkeys sync between devices, e.g. via a password manager. */
  deviceType: 'singleDevice' | 'multiDevice';
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

/**
 * The WebAuthn options and responses are passed through as-is; their shapes
 * are owned by `@simplewebauthn/browser` and `@simplewebauthn/server`.
 */
export type PasskeyCeremonyJSON = Record<string, unknown>;

export interface PasskeyRegistrationOptionsData {
  password: string;
  /** Required when two-factor authentication is enabled. */
  otp?: string;
}

export interface PasskeyRegistrationVerifyData {
  response: PasskeyCeremonyJSON;
  name: string;
}

export interface PasskeyUpdateData {
  name: string;
}

export interface PasskeyDeleteData {
  password: string;
  /** Required when two-factor authentication is enabled. */
  otp?: string;
}

export interface PasskeyLoginData {
  response: PasskeyCeremonyJSON;
  remember: boolean;
}
