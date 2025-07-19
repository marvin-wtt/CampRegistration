import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useCampDetailsStore } from 'stores/camp-details-store';
import type { QSelectOption } from 'quasar';

type CategoryType = 'income' | 'expense';

export interface ExpenseOption extends QSelectOption<string> {
  type: CategoryType;
}

interface RawCategory {
  value: string;
  type: CategoryType;
}

type ExpensePresets = Record<string, RawCategory[]>;

const presets: ExpensePresets = {
  default: [
    // income
    { value: 'default.income.participation_fees', type: 'income' },
    { value: 'default.income.donations', type: 'income' },
    { value: 'default.income.sponsorships', type: 'income' },
    { value: 'default.income.grants', type: 'income' },
    { value: 'default.income.others', type: 'income' },
    // expense
    { value: 'default.expense.travel', type: 'expense' },
    { value: 'default.expense.accommodation', type: 'expense' },
    { value: 'default.expense.food', type: 'expense' },
    { value: 'default.expense.materials', type: 'expense' },
    { value: 'default.expense.personnel', type: 'expense' },
    { value: 'default.expense.others', type: 'expense' },
  ],
  fgyo: [
    // income
    { value: 'fgyo.income.subsidy', type: 'income' },
    { value: 'fgyo.income.public_funds', type: 'income' },
    { value: 'fgyo.income.local_organization', type: 'income' },
    { value: 'fgyo.income.partner_organization', type: 'income' },
    { value: 'fgyo.income.private_institution', type: 'income' },
    { value: 'fgyo.income.companies', type: 'income' },
    { value: 'fgyo.income.participation_fees', type: 'income' },
    { value: 'fgyo.income.foundation', type: 'income' },
    { value: 'fgyo.income.others', type: 'income' },
    // expense
    { value: 'fgyo.expense.travel_costs', type: 'expense' },
    { value: 'fgyo.expense.basic_costs', type: 'expense' },
    { value: 'fgyo.expense.project_costs', type: 'expense' },
    { value: 'fgyo.expense.material_costs', type: 'expense' },
    { value: 'fgyo.expense.language_support_costs', type: 'expense' },
    { value: 'fgyo.expense.hybrid_project_costs', type: 'expense' },
    { value: 'fgyo.expense.non_project_related_expenses', type: 'expense' },
    { value: 'fgyo.expense.investment_costs', type: 'expense' },
    { value: 'fgyo.expense.personnel_costs', type: 'expense' },
    { value: 'fgyo.expense.others', type: 'expense' },
  ],
};

export function useExpenseCategories() {
  const { data: camp } = storeToRefs(useCampDetailsStore());
  const { t } = useI18n({ useScope: 'global' });

  const campType = computed<string>(() => camp.value?.type ?? 'default');

  const categories = computed(() => {
    const categories = presets[campType.value] || presets.default!;

    return categories.map<ExpenseOption>((cat) => ({
      label: t(`expense.category.${cat.value}`),
      value: cat.value,
      type: cat.type,
    }));
  });

  // map all categories of a given type
  const mapBytype = (type: 'income' | 'expense') =>
    categories.value.filter((cat) => cat.type === type);

  const incomeCategories = computed(() => mapBytype('income'));
  const expenseCategories = computed(() => mapBytype('expense'));

  return { categories, incomeCategories, expenseCategories };
}
