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
    // expense
    { value: 'default.expense.travel', type: 'expense' },
    { value: 'default.expense.accommodation', type: 'expense' },
    { value: 'default.expense.food', type: 'expense' },
    { value: 'default.expense.materials', type: 'expense' },
    { value: 'default.expense.personnel', type: 'expense' },
    { value: 'default.expense.others', type: 'expense' },
    // income
    { value: 'default.income.participationFees', type: 'income' },
    { value: 'default.income.donations', type: 'income' },
    { value: 'default.income.sponsorships', type: 'income' },
    { value: 'default.income.grants', type: 'income' },
    { value: 'default.income.others', type: 'income' },
  ],
  fgyo: [
    // eligible
    { value: 'fgyo.eligible.travelCosts', type: 'expense' },
    { value: 'fgyo.eligible.basicCosts', type: 'expense' },
    { value: 'fgyo.eligible.projectCosts', type: 'expense' },
    { value: 'fgyo.eligible.languageSupportCosts', type: 'expense' },
    { value: 'fgyo.eligible.hybridProjectCosts', type: 'expense' },
    // non-eligible
    { value: 'fgyo.nonEligible.notProjectRelatedExpenses', type: 'expense' },
    { value: 'fgyo.nonEligible.investmentCosts', type: 'expense' },
    { value: 'fgyo.nonEligible.personnelCosts', type: 'expense' },
    { value: 'fgyo.nonEligible.others', type: 'expense' },
    // income
    { value: 'fgyo.income.subsidy', type: 'income' },
    { value: 'fgyo.income.publicFunds', type: 'income' },
    { value: 'fgyo.income.localOrganization', type: 'income' },
    { value: 'fgyo.income.partnerOrganization', type: 'income' },
    { value: 'fgyo.income.privateInstitutions', type: 'income' },
    { value: 'fgyo.income.companies', type: 'income' },
    { value: 'fgyo.income.participationFees', type: 'income' },
    { value: 'fgyo.income.foundation', type: 'income' },
    { value: 'fgyo.income.others', type: 'income' },
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
