<template>
  <finance-tab-layout>
    <!-- The total leads; phones keep their filter button beside it. -->
    <finance-totals-strip
      :dense="!wide"
      class="row items-center no-wrap"
      data-test="expense-totals"
    >
      <finance-figure
        :label="
          wide
            ? t('finance.summary.net')
            : `${t('finance.summary.net')} · ${t('finance.receiptCount', filtered.length)}`
        "
        :value="money(net)"
        lead
        :class="wide ? 'col-auto' : 'col'"
      />
      <template v-if="wide">
        <q-separator
          vertical
          class="q-mx-lg"
        />
        <finance-figure
          :label="t('finance.summary.expenses')"
          :value="money(totals.expenses)"
        />
        <finance-figure
          :label="t('finance.summary.refunds')"
          :value="`−${money(totals.refunds)}`"
          tone="refund"
          class="q-ml-xl"
        />
        <q-space />
        <span class="text-body2 text-on-surface-variant">
          {{ t('finance.receiptCount', filtered.length) }}
        </span>
      </template>
      <filter-chip
        v-else-if="quasar.screen.xs"
        :active="active.length > 0"
        icon="filter_list"
        clickable
        data-test="expense-filter-open"
        @click="filterSheetOpen = true"
      >
        {{
          active.length
            ? t('finance.filter.activeCount', { count: active.length })
            : t('finance.filter.title')
        }}
      </filter-chip>
    </finance-totals-strip>

    <expense-filter-bar
      v-model:sheet-open="filterSheetOpen"
      :choices
      :flags
      :active
      @reset="reset"
    />

    <div
      v-if="filtered.length === 0"
      class="row items-center q-gutter-x-sm text-body2 text-on-surface-variant q-py-lg"
    >
      <q-icon
        name="filter_alt_off"
        size="20px"
      />
      <span>{{ t('finance.filter.noMatch') }}</span>
    </div>

    <!-- Grouped by day, newest first; receipts still to come last -->
    <template v-else>
      <div
        v-for="day in days"
        :key="day.date ?? 'pending'"
        class="column no-wrap day-group"
      >
        <div
          class="day-header row items-center justify-between no-wrap q-px-sm"
          :class="{ 'day-header--pending': !day.date }"
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
          :class="{ 'expense-list--pending': !day.date }"
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
import FilterChip from '@/components/common/FilterChip.vue';
import ExpenseFilterBar from '@/components/event/finances/ExpenseFilterBar.vue';
import ExpenseRow from '@/components/event/finances/ExpenseRow.vue';
import FinanceFigure from '@/components/event/finances/FinanceFigure.vue';
import FinanceTotalsStrip from '@/components/event/finances/FinanceTotalsStrip.vue';
import FinanceTabLayout from '@/components/event/finances/FinanceTabLayout.vue';
import { useExpenseFilters } from '@/composables/expenseFilters';
import { useFinanceDialogs } from '@/composables/financeDialogs';
import { useFinanceFormat } from '@/composables/financeFormat';
import { parseLocalDate } from '@/utils/date';

const { expenses, categories } = defineProps<{
  expenses: readonly Expense[];
  categories: readonly FinanceCategory[];
}>();

const dialogs = useFinanceDialogs();

const quasar = useQuasar();
const { t, d } = useI18n();
const { money } = useFinanceFormat();

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

// Newest first, as a log is read during the event. Receipts still to come
// have no date and go last: they stay for weeks, and would otherwise push
// today down every time. Their warning colour and the filter find them.
const days = computed(() => {
  const byDate = new Map<string | null, Expense[]>();
  const sorted = [...filtered.value].sort(
    (a, b) =>
      (b.date ?? '0000').localeCompare(a.date ?? '0000') ||
      b.receiptNumber - a.receiptNumber,
  );
  for (const expense of sorted) {
    byDate.set(expense.date, [...(byDate.get(expense.date) ?? []), expense]);
  }
  return [...byDate].map(([date, list]) => ({
    date,
    expenses: list,
    total: list.reduce((sum, e) => sum + signedAmount(e), 0),
  }));
});

const totals = computed(() =>
  filtered.value.reduce(
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
