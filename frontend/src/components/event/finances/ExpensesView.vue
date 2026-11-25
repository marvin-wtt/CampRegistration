<template>
  <finance-tab-layout>
    <!-- Follows search and filters, so a filtered list has its own total. -->
    <finance-headline
      compact
      icon="receipt_long"
      :eyebrow="t('headline.spent')"
      :amount="money(net)"
      :caption="
        [
          t('finance.receiptCount', shown.length),
          totals.refunds > 0 &&
            t('headline.refunds', { amount: money(totals.refunds) }),
        ]
          .filter(Boolean)
          .join(' · ')
      "
      data-test="expense-totals"
    />

    <list-controls
      v-model:search="search"
      v-model:sort="sort"
      v-model:descending="descending"
      :sorts="sortOptions"
      :placeholder="t('search')"
      test-id="expense"
    >
      <m-btn
        v-if="quasar.screen.xs"
        icon="tune"
        :color="active.length > 0 ? 'primary' : 'on-surface-variant'"
        flat
        round
        :aria-label="t('finance.filter.title')"
        data-test="expense-filter-open"
        @click="filterSheetOpen = true"
      >
        <q-badge
          v-if="active.length > 0"
          :label="active.length"
          color="primary"
          floating
        />
      </m-btn>
      <template
        v-if="!quasar.screen.xs"
        #filters
      >
        <expense-filter-bar
          :choices
          :flags
          :active
          @reset="reset"
        />
      </template>
    </list-controls>

    <!-- Phones: the active filters, and the sheet the button opens. -->
    <expense-filter-bar
      v-if="quasar.screen.xs"
      v-model:sheet-open="filterSheetOpen"
      :choices
      :flags
      :active
      @reset="reset"
    />

    <div
      v-if="shown.length === 0"
      class="row items-center q-gutter-x-sm text-body2 text-on-surface-variant q-py-lg"
    >
      <q-icon
        name="filter_alt_off"
        size="20px"
      />
      <span>{{ t('finance.filter.noMatch') }}</span>
    </div>

    <!-- By date: grouped by day, receipts still to come last. By number or
         amount: one list. -->
    <template v-else>
      <div
        v-for="day in days"
        :key="day.key"
        class="column no-wrap day-group"
      >
        <div
          v-if="day.date !== undefined"
          class="day-header row items-center justify-between no-wrap q-px-sm"
          :class="{ 'day-header--pending': day.date === null }"
        >
          <span
            v-if="day.date"
            class="text-overline text-on-surface-variant"
          >
            {{ d(parseLocalDate(day.date), 'date') }}
          </span>
          <span
            v-else
            class="row items-center no-wrap q-gutter-x-xs text-body2 text-weight-medium"
          >
            <q-icon
              name="hourglass_empty"
              size="18px"
            />
            <span>
              {{ t('finance.receiptPending') }} · {{ day.expenses.length }}
            </span>
          </span>
          <span
            v-if="wide"
            class="text-caption text-on-surface-variant text-amount"
          >
            {{ money(day.total) }}
          </span>
        </div>

        <q-list
          separator
          class="expense-list rounded-xl"
          :class="{ 'expense-list--pending': day.date === null }"
        >
          <expense-row
            v-for="expense in day.expenses"
            :key="expense.id"
            :expense
            :wide
            @open="dialogs.expenseDetails"
          />
        </q-list>
      </div>
    </template>
  </finance-tab-layout>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type {
  Expense,
  FinanceCategory,
} from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import ListControls from '@/components/common/ListControls.vue';
import ExpenseFilterBar from '@/components/event/finances/ExpenseFilterBar.vue';
import ExpenseRow from '@/components/event/finances/ExpenseRow.vue';
import FinanceHeadline from '@/components/event/finances/FinanceHeadline.vue';
import FinanceTabLayout from '@/components/event/finances/FinanceTabLayout.vue';
import { useExpenseFilters } from '@/composables/expenseFilters';
import { useFinanceDialogs } from '@/composables/financeDialogs';
import { useFinanceFormat } from '@/composables/financeFormat';
import { useQuerySort } from '@/composables/querySort';
import { parseLocalDate } from '@/utils/date';
import { LEDGER_SORTS, groupsByDay, sortLedger } from '@/utils/ledgerSort';
import { matchesText } from '@/utils/textSearch';

const { expenses, categories } = defineProps<{
  expenses: readonly Expense[];
  categories: readonly FinanceCategory[];
}>();

const dialogs = useFinanceDialogs();

const quasar = useQuasar();
const { t, d } = useI18n();
const { money, payerName, categoryPath } = useFinanceFormat();

// Payer, receipt and actions get their own columns once there is room.
const wide = computed(() => quasar.screen.gt.sm);

const { choices, flags, active, filtered, reset } = useExpenseFilters(
  () => expenses,
  () => categories,
);
const filterSheetOpen = ref(false);

function signedAmount(expense: Expense): number {
  return expense.type === 'REFUND' ? -expense.amount : expense.amount;
}

const search = ref<string | null>('');

// Newest first by default, as a log is read during the event.
const { sort, descending } = useQuerySort(LEDGER_SORTS, 'date', () => true);
const sortOptions = computed(() =>
  LEDGER_SORTS.map((value) => ({
    value,
    label: t(`sort.${value}`),
    direction: value === 'date' ? ('date' as const) : ('number' as const),
  })),
);

const shown = computed(() =>
  filtered.value.filter((e) =>
    matchesText(search.value, [
      e.description,
      e.vendor,
      payerName(e),
      categoryPath(e.categoryId),
      `#${e.receiptNumber.toString()}`,
    ]),
  ),
);

// A day per date; `undefined` is the one list when not sorted by date.
const days = computed(() => {
  const sorted = sortLedger(shown.value, sort.value, descending.value, (e) => ({
    date: e.date,
    number: e.receiptNumber,
    amount: e.amount,
  }));
  const section = (date: string | null | undefined, list: Expense[]) => ({
    key: date === undefined ? 'all' : (date ?? 'pending'),
    date,
    expenses: list,
    total: list.reduce((sum, e) => sum + signedAmount(e), 0),
  });

  if (!groupsByDay(sort.value)) {
    return [section(undefined, sorted)];
  }
  const byDate = new Map<string | null, Expense[]>();
  for (const expense of sorted) {
    byDate.set(expense.date, [...(byDate.get(expense.date) ?? []), expense]);
  }
  return [...byDate].map(([date, list]) => section(date, list));
});

const totals = computed(() =>
  shown.value.reduce(
    (sum, e) =>
      e.type === 'REFUND'
        ? { ...sum, refunds: sum.refunds + e.amount }
        : { ...sum, expenses: sum.expenses + e.amount },
    { expenses: 0, refunds: 0 },
  ),
);
const net = computed(() => totals.value.expenses - totals.value.refunds);
</script>

<style scoped>
.day-group {
  gap: 4px;
}

.day-header {
  min-height: 28px;
}

.day-header--pending {
  color: var(--md3-warning);
}

.expense-list {
  overflow: hidden;
  border: 1px solid var(--md3-outline-variant);
  background: var(--md3-surface-container-low);
}

.expense-list--pending {
  border-color: color-mix(in srgb, var(--md3-warning) 40%, transparent);
}
</style>

<i18n lang="yaml" locale="en">
headline:
  spent: 'Spent'
  refunds: 'after {amount} in refunds'
search: 'Search or #number'
sort:
  date: 'Date'
  number: 'Receipt number'
  amount: 'Amount'
</i18n>

<i18n lang="yaml" locale="de">
headline:
  spent: 'Ausgegeben'
  refunds: 'nach {amount} Erstattungen'
search: 'Suchen oder #Nummer'
sort:
  date: 'Datum'
  number: 'Belegnummer'
  amount: 'Betrag'
</i18n>

<i18n lang="yaml" locale="fr">
headline:
  spent: 'Dépensé'
  refunds: 'après {amount} de remboursements'
search: 'Rechercher ou n°'
sort:
  date: 'Date'
  number: 'Numéro de justificatif'
  amount: 'Montant'
</i18n>

<i18n lang="yaml" locale="pl">
headline:
  spent: 'Wydano'
  refunds: 'po zwrotach {amount}'
search: 'Szukaj lub #numer'
sort:
  date: 'Data'
  number: 'Numer dowodu'
  amount: 'Kwota'
</i18n>

<i18n lang="yaml" locale="cs">
headline:
  spent: 'Utraceno'
  refunds: 'po vratkách {amount}'
search: 'Hledat nebo #číslo'
sort:
  date: 'Datum'
  number: 'Číslo dokladu'
  amount: 'Částka'
</i18n>
