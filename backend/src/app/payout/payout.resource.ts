import type { Payout as PayoutData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { ownedByRequester } from '#core/permission/ownership';
import type { PayoutWithPrefix } from '#app/payout/payout.service';

export class PayoutResource extends JsonResource<PayoutWithPrefix, PayoutData> {
  transform(): PayoutData {
    return {
      id: this.data.id,
      number: this.data.number,
      label: `${this.data.event.payoutNumberPrefix}${this.data.number.toString()}`,
      recipientUserId: this.data.recipientUserId,
      recipientName: this.data.recipientName,
      direction: this.data.direction,
      amount: this.data.amount,
      paidOn: this.data.paidOn,
      note: this.data.note,
      signature: this.data.signature,
      signedAt: this.data.signedAt?.toISOString() ?? null,
      createdByUserId: this.data.createdByUserId,
      createdByName: this.data.createdBy?.name ?? null,
      owned: ownedByRequester('payout', this.data),
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
    };
  }
}
