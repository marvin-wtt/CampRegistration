import type { Identifiable } from './Identifiable.js';
import type { Translatable } from './Translatable.js';

export type FinanceCategoryKind = 'EXPENSE' | 'INCOME';

/**
 * Per event. A category with a `parentId` is a leaf; one without is either a
 * group (it has children) or a leaf at the top level. Only leaves hold
 * records; expense and income categories are separate lists.
 */
export interface FinanceCategory extends Identifiable {
  kind: FinanceCategoryKind;
  parentId: string | null;
  name: Translatable;
  position: number;
  archivedAt: string | null;
  /** Expenses filed under it; a used category can only be archived. */
  expenseCount: number;
}

export interface FinanceCategoryCreateData {
  parentId?: string | null | undefined;
  name: Translatable;
  position?: number | undefined;
}

export interface FinanceCategoryUpdateData {
  name?: Translatable | undefined;
  archived?: boolean | undefined;
}

/** The whole tree's order in one request: drag to reorder and regroup. */
export interface FinanceCategoryOrderData {
  items: {
    id: string;
    parentId: string | null;
    position: number;
  }[];
}
