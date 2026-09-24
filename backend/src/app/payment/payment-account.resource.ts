import type { PaymentAccount as PaymentAccountModel } from '#generated/prisma/client.js';
import type { PaymentAccount as PaymentAccountData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

/** Never exposes credentials — only what identifies the connected account. */
export class PaymentAccountResource extends JsonResource<
  PaymentAccountModel,
  PaymentAccountData
> {
  transform(): PaymentAccountData {
    return {
      provider: this.data.provider as PaymentAccountData['provider'],
      mode: this.data.mode === 'live' ? 'live' : 'test',
      displayName: this.data.displayName,
      connectedAt: (this.data.updatedAt ?? this.data.createdAt).toISOString(),
    };
  }
}
