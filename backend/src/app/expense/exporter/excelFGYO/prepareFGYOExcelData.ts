import type { Expense } from '@camp-registration/common/entities';
import type { BudgetCategories } from './ReceiptListFileConfig.js';

export type ExpenseWithSection = Expense & { section: keyof BudgetCategories };

export const prepareFGYOExcelData = (
  expenses: Expense[],
  categories: BudgetCategories,
): ExpenseWithSection[] => {
  const PREFIX = 'fgyo.';

  return expenses.map((expense) => {
    const raw = expense.category.startsWith(PREFIX)
      ? expense.category.slice(PREFIX.length)
      : '';

    let [section = '', key = ''] = raw.split('.');

    if (
      !(section in categories) ||
      !(key in categories[section as keyof typeof categories])
    ) {
      section = expense.amount < 0 ? 'income' : 'nonEligible';
      key = 'others';
    }

    const dict = categories[section as keyof typeof categories];
    const category = dict[key as keyof typeof dict];

    return {
      ...expense,
      section: section as keyof BudgetCategories,
      category,
    };
  });
};
