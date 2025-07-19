import type { QSelectOption } from 'quasar';

export type CategoryKind = 'income' | 'expense';

export interface ExpenseCategory extends QSelectOption<string> {
  kind: CategoryKind;
  subcategories?: ExpenseCategory[];
}
