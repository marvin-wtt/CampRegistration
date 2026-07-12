import { createHmac } from 'node:crypto';

// Mirrors how TotpService hashes recovery codes for storage.
export const hashRecoveryCode = (code: string): string => {
  return createHmac('sha256', process.env.TOTP_RECOVERY_CODE_SECRET!)
    .update(code)
    .digest('hex');
};
