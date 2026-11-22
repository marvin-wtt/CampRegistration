import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { formatMoney } from '@camp-registration/common/utils';
import type {
  Expense,
  FinanceCategory,
} from '@camp-registration/common/entities';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useFinanceStore } from '@/stores/finance-store';
import { useObjectTranslation } from '@/composables/objectTranslation';

/** A category grouped under its parent, for pickers and the summary. */
interface CategoryGroup {
  /** `null` for the top-level categories that belong to no group. */
  group: FinanceCategory | null;
  categories: FinanceCategory[];
}

const byPosition = (a: FinanceCategory, b: FinanceCategory) =>
  a.position - b.position || a.id.localeCompare(b.id);

/** Splits a flat category list into groups; leaves without a group come first. */
export function groupCategories(list: readonly FinanceCategory[]) {
  const sorted = [...list].sort(byPosition);
  const parentIds = new Set(sorted.flatMap((c) => c.parentId ?? []));
  const groups: CategoryGroup[] = [
    {
      group: null,
      categories: sorted.filter((c) => !c.parentId && !parentIds.has(c.id)),
    },
  ];

  for (const parent of sorted.filter((c) => parentIds.has(c.id))) {
    groups.push({
      group: parent,
      categories: sorted.filter((c) => c.parentId === parent.id),
    });
  }

  return groups.filter((g) => g.group !== null || g.categories.length > 0);
}

/** Formatting shared by the finance views: amounts, categories, payers. */
export function useFinanceFormat() {
  const { t, locale } = useI18n({ useScope: 'global' });
  const { to } = useObjectTranslation();
  const { data: event } = storeToRefs(useEventDetailsStore());
  const { categoriesById } = storeToRefs(useFinanceStore());

  const currency = computed(() => event.value?.currency ?? 'EUR');

  function money(minor: number, currencyCode = currency.value): string {
    return formatMoney(minor, currencyCode, locale.value);
  }

  /** What the expense moves: a refund reads as negative. */
  function signedMoney(expense: Pick<Expense, 'amount' | 'type'>): string {
    return money(expense.type === 'REFUND' ? -expense.amount : expense.amount);
  }

  function categoryName(id: string | null | undefined): string {
    const category = id ? categoriesById.value.get(id) : undefined;
    return category ? to(category.name) : '';
  }

  function categoryGroupName(id: string | null | undefined): string {
    const parentId = id ? categoriesById.value.get(id)?.parentId : null;
    return categoryName(parentId);
  }

  /** Group and category, as `Travel · Fuel`; empty without a category. */
  function categoryPath(id: string | null | undefined): string {
    return [categoryGroupName(id), categoryName(id)]
      .filter(Boolean)
      .join(' · ');
  }

  function payerName(
    expense: Pick<Expense, 'paidByUserId' | 'paidByName'>,
  ): string {
    return expense.paidByName ?? t('finance.eventFunds');
  }

  return {
    currency,
    money,
    signedMoney,
    categoryName,
    categoryGroupName,
    categoryPath,
    payerName,
  };
}
