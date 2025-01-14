import type { TotpData } from '@camp-registration/common/entities';

interface Totp {
  secret: string;
  url: string;
}

export const totpResource = (totp: Totp): TotpData => {
  return {
    secret: totp.secret,
    url: totp.url,
  };
};

export default totpResource;
