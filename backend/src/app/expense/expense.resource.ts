import type { Expense as ExpenseData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { ownedByRequester } from '#core/permission/ownership';
import { FileResource } from '#app/file/file.resource';
import type { ExpenseWithFiles } from '#app/expense/expense.service';

export class ExpenseResource extends JsonResource<
  ExpenseWithFiles,
  ExpenseData
> {
  transform(): ExpenseData {
    return {
      id: this.data.id,
      receiptNumber: this.data.receiptNumber,
      type: this.data.type,
      amount: this.data.amount,
      originalAmount: this.data.originalAmount,
      originalCurrency: this.data.originalCurrency,
      date: this.data.date,
      description: this.data.description,
      categoryId: this.data.categoryId,
      paidByUserId: this.data.paidByUserId,
      paidByName: this.data.paidByName,
      createdByUserId: this.data.createdByUserId,
      owned: ownedByRequester('expense', this.data),
      files: FileResource.collection(this.data.files).transform(),
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
    };
  }
}
