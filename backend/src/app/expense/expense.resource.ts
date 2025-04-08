import type { Expense, File } from '@prisma/client';
import type { Expense as ExpenseResourceData } from '@camp-registration/common/entities';
import { FileResource } from '#app/file/file.resource';
import { JsonResource } from '#core/resource/JsonResource';

interface ExpenseWithFile extends Expense {
  file: File | null;
}

export class ExpenseResource extends JsonResource<
  ExpenseWithFile,
  ExpenseResourceData
> {
  transform(): ExpenseResourceData {
    return {
      id: this.data.id,
      receiptNumber: this.data.receiptNumber,
      name: this.data.name,
      description: this.data.description ?? null,
      category: this.data.category,
      amount: this.data.amount.toNumber(),
      date: this.data.date.toISOString(),
      paidAt: this.data.paidAt?.toISOString() ?? null,
      paidBy: this.data.paidBy ?? null,
      payee: this.data.payee ?? null,
      file: this.data.file
        ? new FileResource(this.data.file).transform()
        : null,
    };
  }
}
