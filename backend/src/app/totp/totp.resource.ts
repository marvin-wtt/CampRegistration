import type {
  TotpData,
  TotpRecoveryCodesData,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

interface Totp {
  secret: string;
  url: string;
}

export class TotpResource extends JsonResource<Totp, TotpData> {
  transform(): TotpData {
    return {
      secret: this.data.secret,
      url: this.data.url,
    };
  }
}

export class TotpRecoveryCodesResource extends JsonResource<
  string[],
  TotpRecoveryCodesData
> {
  transform(): TotpRecoveryCodesData {
    return {
      codes: this.data,
    };
  }
}
