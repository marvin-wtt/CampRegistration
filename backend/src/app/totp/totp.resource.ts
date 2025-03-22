import type { TotpData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource.js';

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
