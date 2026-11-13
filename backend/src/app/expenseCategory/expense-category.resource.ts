import type { ExpenseCategory as ExpenseCategoryData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import type { ExpenseCategoryWithCount } from '#app/expenseCategory/expense-category.service';

export class ExpenseCategoryResource extends JsonResource<
  ExpenseCategoryWithCount,
  ExpenseCategoryData
> {
  transform(): ExpenseCategoryData {
    return {
      id: this.data.id,
      parentId: this.data.parentId,
      name: this.data.name as ExpenseCategoryData['name'],
      position: this.data.position,
      archivedAt: this.data.archivedAt?.toISOString() ?? null,
      expenseCount: this.data._count.expenses,
    };
  }
}
