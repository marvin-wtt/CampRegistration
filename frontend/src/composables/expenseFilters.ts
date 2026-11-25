import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  Expense,
  FinanceCategory,
} from '@camp-registration/common/entities';
import { payerKey } from '@camp-registration/common/utils';
import { groupCategories, useFinanceFormat } from '@/composables/financeFormat';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';
import { useFinanceStore } from '@/stores/finance-store';
import { hasNoCategory, isMissingFile, isPending } from '@/utils/expenseState';

export interface FilterOption {
  value: string;
  label: string;
  /** Shown below the label in lists, e.g. a category's group. */
  caption?: string | undefined;
}

/** A filter that is either on or off, e.g. "missing receipt file". */
export interface FlagFilter {
  key: string;
  icon: string;
  /** With its count, for the chip and the sheet. */
  label: string;
  /** Short, for the chip that removes it. */
  activeLabel: string;
  shown: boolean;
  active: boolean;
  set: (on: boolean) => void;
}

/** A filter picking one value, e.g. a category. */
export interface ChoiceFilter {
  key: string;
  icon: string;
  label: string;
  options: FilterOption[];
  value: string | null;
  set: (value: string | null) => void;
}

/** An active filter, as a chip that removes it. */
export interface ActiveFilter {
  key: string;
  icon: string;
  label: string;
  clear: () => void;
}

const QUERY_KEYS = ['category', 'payer', 'noFile', 'noCategory', 'pending'];

// Expenses from event funds have no payer: filtered as their own entry.
const payerFilterKey = (expense: Expense) => payerKey(expense) ?? 'funds';

/**
 * The expense list's filters. They live in the query, so the summary and the
 * dashboard can link to a filtered list and a reload keeps it.
 */
export function useExpenseFilters(
  expenses: MaybeRefOrGetter<readonly Expense[]>,
  categories: MaybeRefOrGetter<readonly FinanceCategory[]>,
) {
  const { t } = useI18n();
  const { to } = useObjectTranslation();
  const { payerName } = useFinanceFormat();
  const financeStore = useFinanceStore();
  const { getStringQueryParam, getBooleanQueryParam, setQueryParams } =
    useRouteQueryParams();

  const value = (field: string) => getStringQueryParam(field) || null;
  const flag = (field: string) => getBooleanQueryParam(field) ?? false;

  const categoryOptions = computed<FilterOption[]>(() =>
    groupCategories(toValue(categories)).flatMap((group) =>
      group.categories.map((c) => ({
        value: c.id,
        label: to(c.name),
        caption: group.group ? to(group.group.name) : undefined,
      })),
    ),
  );

  const payerOptions = computed<FilterOption[]>(() => {
    const seen = new Map<string, string>();
    for (const expense of toValue(expenses)) {
      seen.set(payerFilterKey(expense), payerName(expense));
    }
    return [...seen].map(([key, label]) => ({ value: key, label }));
  });

  const choices = computed<ChoiceFilter[]>(() => [
    {
      key: 'category',
      icon: 'category',
      label: t('finance.field.category'),
      options: categoryOptions.value,
      value: value('category'),
      set: (next) => setQueryParams({ category: next }),
    },
    {
      key: 'payer',
      icon: 'person',
      label: t('finance.field.paidBy'),
      options: payerOptions.value,
      value: value('payer'),
      set: (next) => setQueryParams({ payer: next }),
    },
  ]);

  const flags = computed<FlagFilter[]>(() => {
    const list = toValue(expenses);
    const count = (test: (e: Expense) => boolean) => list.filter(test).length;
    const flagFilter = (
      key: string,
      icon: string,
      label: string,
      activeLabel: string,
      shown: boolean,
    ): FlagFilter => ({
      key,
      icon,
      label,
      activeLabel,
      shown,
      // A filter that isn't offered, e.g. turned off in the settings, is off.
      active: shown && flag(key),
      set: (on) => setQueryParams({ [key]: on || null }),
    });
    const noCategory = count((e) => financeStore.isMissingCategory(e));

    return [
      flagFilter(
        'pending',
        'hourglass_empty',
        t('finance.filter.pending', { count: count(isPending) }),
        t('finance.receiptPending'),
        count(isPending) > 0 || flag('pending'),
      ),
      // Only where missing categories are marked, and while there are any.
      flagFilter(
        'noCategory',
        'label_off',
        t('finance.filter.missingCategory', { count: noCategory }),
        t('finance.noCategory'),
        financeStore.display.flagMissingCategories &&
          (noCategory > 0 || flag('noCategory')),
      ),
      flagFilter(
        'noFile',
        'no_photography',
        t('finance.filter.missingFile', { count: count(isMissingFile) }),
        t('finance.noFile'),
        true,
      ),
    ];
  });

  const flagTests: Record<string, (e: Expense) => boolean> = {
    noFile: isMissingFile,
    // Also where the event doesn't flag it, e.g. from an older link.
    noCategory: hasNoCategory,
    pending: isPending,
  };

  const filtered = computed(() => {
    const category = value('category');
    const payer = value('payer');
    const tests = flags.value
      .filter((f) => f.active)
      .map((f) => flagTests[f.key])
      .filter((test) => test !== undefined);
    return toValue(expenses).filter(
      (e) =>
        (!category || e.categoryId === category) &&
        (!payer || payerFilterKey(e) === payer) &&
        tests.every((test) => test(e)),
    );
  });

  /** Every active filter as a chip that removes it. */
  const active = computed<ActiveFilter[]>(() => [
    ...choices.value
      .filter((c) => c.value !== null)
      .map((c) => ({
        key: c.key,
        icon: c.icon,
        label: c.options.find((o) => o.value === c.value)?.label ?? '',
        clear: () => c.set(null),
      })),
    ...flags.value
      .filter((f) => f.active)
      .map((f) => ({
        key: f.key,
        icon: f.icon,
        label: f.activeLabel,
        clear: () => f.set(false),
      })),
  ]);

  // One navigation: separate writes would each start from the old query.
  function reset() {
    setQueryParams(Object.fromEntries(QUERY_KEYS.map((key) => [key, null])));
  }

  return { choices, flags, active, filtered, reset };
}
