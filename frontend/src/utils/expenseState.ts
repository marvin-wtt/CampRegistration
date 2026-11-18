import type { Expense } from '@camp-registration/common/entities';

/** A receipt still to come: no date yet. */
export const isPending = (e: Pick<Expense, 'date'>): boolean => e.date === null;

/** No file although the receipt is there; a pending one is expected to lack it. */
export const isMissingFile = (e: Pick<Expense, 'date' | 'files'>): boolean =>
  e.files.length === 0 && !isPending(e);

/** Not filed under a category, whether or not the event flags that. */
export const hasNoCategory = (e: Pick<Expense, 'categoryId'>): boolean =>
  !e.categoryId;
