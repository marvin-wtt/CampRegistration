import type { FinanceCategory as FinanceCategoryData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import type { FinanceCategoryWithCount } from '#app/financeCategory/finance-category.service';

export class FinanceCategoryResource extends JsonResource<
  FinanceCategoryWithCount,
  FinanceCategoryData
> {
  transform(): FinanceCategoryData {
    return {
      id: this.data.id,
      kind: this.data.kind,
      parentId: this.data.parentId,
      name: this.data.name,
      position: this.data.position,
      archivedAt: this.data.archivedAt?.toISOString() ?? null,
      expenseCount: this.data._count.expenses,
    };
  }
}
