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
    { value: 'participation_fees', type: 'income' },
    { value: 'donations', type: 'income' },
    { value: 'sponsorships', type: 'income' },
    { value: 'grants', type: 'income' },
    { value: 'others', type: 'income' },
    // expense
    { value: 'travel', type: 'expense' },
    { value: 'accommodation', type: 'expense' },
    { value: 'food', type: 'expense' },
    { value: 'materials', type: 'expense' },
    { value: 'personnel', type: 'expense' },
    { value: 'others', type: 'expense' },
  ],
  fgyo: [
    // income
    { value: 'subsidy', type: 'income' },
    { value: 'public_funds', type: 'income' },
    { value: 'local_organization', type: 'income' },
    { value: 'partner_organization', type: 'income' },
    { value: 'private_institution', type: 'income' },
    { value: 'companies', type: 'income' },
    { value: 'participation_fees', type: 'income' },
    { value: 'foundation', type: 'income' },
    { value: 'others', type: 'income' },
    // expense
    { value: 'travel_costs', type: 'expense' },
    { value: 'basic_costs', type: 'expense' },
    { value: 'project_costs', type: 'expense' },
    { value: 'material_costs', type: 'expense' },
    { value: 'language_support_costs', type: 'expense' },
    { value: 'hybrid_project_costs', type: 'expense' },
    { value: 'non_project_related_expenses', type: 'expense' },
    { value: 'investment_costs', type: 'expense' },
    { value: 'personnel_costs', type: 'expense' },
    { value: 'others', type: 'expense' },
  ],
};

export function useExpenseCategories() {
  const { data: camp } = storeToRefs(useCampDetailsStore());
  const { t } = useI18n({ useScope: 'global' });

  const campType = computed<string>(() => camp.value?.type ?? 'default');

  const categories = computed(() => {
    const categories = presets[campType.value] || presets.default!;

    const tPrefix = 'expense.category';

    return categories.map<ExpenseOption>((cat) => ({
      label: t(`${tPrefix}.${campType.value}.${cat.type}.${cat.value}`),
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
