import type { Payout as PayoutData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { ownedByRequester } from '#core/permission/ownership';
import { FileResource } from '#app/file/file.resource';
import type { PayoutView } from '#app/payout/payout.service';
import { readStatement } from '#app/payout/payout.statement';

export class PayoutResource extends JsonResource<PayoutView, PayoutData> {
  transform(): PayoutData {
    const statement = readStatement(this.data.statement);

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
      files: FileResource.collection(this.data.files).transform(),
      statement: statement.content,
      statementExpenseIds: statement.basis.expenses.map((e) => e.id),
      statementReceiptsUpTo: statement.basis.receiptsUpTo,
      outdated: this.data.outdated,
      createdByUserId: this.data.createdByUserId,
      createdByName: this.data.createdBy?.name ?? null,
      owned: ownedByRequester('payout', this.data),
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
    };
  }
}
