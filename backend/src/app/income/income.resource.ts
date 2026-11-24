import type { Income as IncomeData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { FileResource } from '#app/file/file.resource';
import type { IncomeView } from '#app/income/income.service';

export class IncomeResource extends JsonResource<IncomeView, IncomeData> {
  transform(): IncomeData {
    return {
      id: this.data.id,
      number: this.data.number,
      label: `${this.data.finance.incomeNumberPrefix}${this.data.number.toString()}`,
      amount: this.data.amount,
      originalAmount: this.data.originalAmount,
      originalCurrency: this.data.originalCurrency,
      receivedOn: this.data.receivedOn,
      description: this.data.description,
      payerName: this.data.payerName,
      categoryId: this.data.categoryId,
      createdByUserId: this.data.createdByUserId,
      files: FileResource.collection(this.data.files).transform(),
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
    };
  }
}
