<template>
  <div class="column no-wrap summary-view">
    <!-- The totals, then who paid them: one strip, as on the balances tab. -->
    <finance-totals-strip
      :alert="summary.owedToEvent > 0"
      data-test="finance-summary-totals"
    >
      <div class="figures row items-end">
        <finance-figure
          :label="t('finance.summary.total')"
          :value="money(summary.total)"
          lead
        >
          {{
            t('finance.summary.totalCaption', {
              expenses: money(summary.expenses),
              refunds: money(summary.refunds),
            })
          }}
        </finance-figure>
        <finance-figure
          :label="t('finance.balance.owedToPeople')"
          :value="money(summary.owedToPeople)"
        />
        <!-- Rare: only while someone owes the event. -->
        <finance-figure
          v-if="summary.owedToEvent > 0"
          :label="t('finance.balance.owedToEvent')"
          :value="money(summary.owedToEvent)"
          tone="warning"
        />
      </div>

      <q-separator class="q-my-md" />

      <div class="column q-gutter-y-sm">
        <span class="text-caption text-on-surface-variant">
          {{ t('finance.summary.paidFrom') }} · {{ t('finance.summary.gross') }}
        </span>
        <div class="split-bar row no-wrap rounded-full">
          <div
            class="split-people"
            :style="{ flexGrow: summary.paidByPeople }"
          />
          <div
            class="split-funds"
            :style="{ flexGrow: summary.paidByFunds }"
          />
        </div>
        <div class="row q-gutter-x-lg text-body2">
          <span class="row items-center no-wrap q-gutter-x-xs">
            <span class="legend legend--people" />
            <span>{{ t('finance.summary.people') }}</span>
            <span class="text-amount">{{ money(summary.paidByPeople) }}</span>
          </span>
          <span class="row items-center no-wrap q-gutter-x-xs">
            <span class="legend legend--funds" />
            <span>{{ t('finance.eventFunds') }}</span>
            <span class="text-amount">{{ money(summary.paidByFunds) }}</span>
          </span>
        </div>
      </div>
    </finance-totals-strip>

    <q-card
      flat
      bordered
      class="rounded-xl"
    >
      <q-card-section class="text-subtitle1 text-weight-medium">
        {{ t('finance.summary.byCategory') }}
      </q-card-section>
      <template
        v-for="group in rows"
        :key="group.key"
      >
        <div
          v-if="group.name"
          class="group-row row items-center justify-between q-px-md q-py-sm"
        >
          <span class="text-weight-medium">{{ group.name }}</span>
          <span class="text-weight-medium text-amount">{{
            money(group.total)
          }}</span>
        </div>
        <router-link
          v-for="row in group.rows"
          :key="row.key"
          :to="row.to"
          class="category-row q-px-md q-py-sm"
          :class="{ 'category-row--nested': !!group.name }"
        >
          <div class="column">
            <span>{{ row.name }}</span>
            <span class="text-caption text-on-surface-variant">
              {{ t('finance.receiptCount', row.count) }}
              <template v-if="row.refunds > 0">
                ·
                {{
                  t('finance.summary.refundedCaption', {
                    amount: money(row.refunds),
                  })
                }}
              </template>
            </span>
          </div>
          <div
            class="bar-track rounded-full"
            aria-hidden="true"
          >
            <div
              class="bar-fill rounded-full"
              :style="{ width: `${barWidth(row.total)}%` }"
            />
          </div>
          <span class="text-right text-amount">{{ money(row.total) }}</span>
        </router-link>
      </template>
      <q-separator />
      <q-card-section class="row items-center justify-between">
        <span class="text-subtitle1 text-weight-bold">
          {{ t('finance.summary.total') }}
        </span>
        <span class="text-subtitle1 text-weight-bold text-amount">
          {{ money(summary.total) }}
        </span>
      </q-card-section>
    </q-card>

    <q-card
      flat
      bordered
      class="rounded-xl"
    >
      <q-card-section class="column q-gutter-y-sm q-pb-sm">
        <div class="row items-baseline justify-between no-wrap">
          <span class="text-subtitle1 text-weight-medium">
            {{ t('finance.summary.receiptFiles') }}
          </span>
          <span class="text-body2 text-on-surface-variant text-amount">
            {{ withFile }} / {{ summary.receiptCount }}
          </span>
        </div>
        <q-linear-progress
          :value="summary.receiptCount ? withFile / summary.receiptCount : 0"
          color="primary"
          track-color="surface-container-highest"
          rounded
          size="6px"
        />
      </q-card-section>

      <!-- Each open point leads to the expenses, filtered to it. -->
      <q-list>
        <q-item
          v-for="item in openPoints"
          :key="item.key"
          :to="item.to"
          active-class=""
          exact-active-class=""
          clickable
          :data-test="`finance-summary-${item.key}`"
        >
          <q-item-section avatar>
            <q-icon
              :name="item.icon"
              color="warning"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ item.label }}</q-item-label>
            <q-item-label
              v-if="item.numbers"
              caption
              class="ellipsis"
            >
              {{ item.numbers }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
        <q-item v-if="openPoints.length === 0">
          <q-item-section avatar>
            <q-icon
              name="task_alt"
              color="positive"
            />
          </q-item-section>
          <q-item-section>{{ t('finance.summary.complete') }}</q-item-section>
        </q-item>
      </q-list>

      <q-card-section class="q-pt-sm">
        <span class="text-caption text-on-surface-variant">
          {{ t('finance.summary.recordsNote') }}
        </span>
      </q-card-section>
    </q-card>

    <q-card
      flat
      class="export-card rounded-xl"
    >
      <q-card-section class="column q-gutter-y-md">
        <div>
          <div class="text-subtitle1 text-weight-medium">
            {{ t('finance.export.title') }}
          </div>
          <div class="text-body2 text-on-surface-variant">
            {{ t('finance.export.text') }}
          </div>
        </div>
        <div class="row q-gutter-sm">
          <m-btn
            :label="t('finance.export.xlsx')"
            icon="download"
            color="primary"
            data-test="finance-export-xlsx"
            @click="download('xlsx')"
          />
          <m-btn
            :label="t('finance.export.csv')"
            icon="download"
            tonal
            @click="download('csv')"
          />
        </div>
        <q-separator />
        <div class="row items-center q-gutter-sm">
          <div class="col-12 col-sm text-body2 text-on-surface-variant">
            {{ t('finance.export.receiptsText') }}
          </div>
          <m-btn
            :label="t('finance.export.receipts')"
            icon="folder_zip"
            icon-right="arrow_drop_down"
            tonal
            :disable="noReceiptFiles"
            data-test="finance-export-receipts"
          >
            <q-menu auto-close>
              <q-list>
                <q-item
                  clickable
                  data-test="finance-export-receipts-flat"
                  @click="download('receipts')"
                >
                  <q-item-section avatar>
                    <q-icon name="folder" />
                  </q-item-section>
                  <q-item-section>
                    {{ t('finance.export.receiptsFlat') }}
                  </q-item-section>
                </q-item>
                <q-item
                  clickable
                  data-test="finance-export-receipts-by-group"
                  @click="download('receiptsByGroup')"
                >
                  <q-item-section avatar>
                    <q-icon name="folder_copy" />
                  </q-item-section>
                  <q-item-section>
                    {{ t('finance.export.receiptsByGroup') }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </m-btn>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type {
  ExpenseCategory,
  FinanceSummary,
} from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import FinanceFigure from '@/components/event/finances/FinanceFigure.vue';
import FinanceTotalsStrip from '@/components/event/finances/FinanceTotalsStrip.vue';
import { groupCategories, useFinanceFormat } from '@/composables/financeFormat';
import { useFinanceStore } from '@/stores/finance-store';
import { useObjectTranslation } from '@/composables/objectTranslation';

const { summary, categories } = defineProps<{
  summary: FinanceSummary;
  categories: readonly ExpenseCategory[];
}>();

const { t } = useI18n();
const { to } = useObjectTranslation();
const { money } = useFinanceFormat();
const financeStore = useFinanceStore();

const noReceiptFiles = computed(
  () => summary.receiptCount === summary.receiptsWithoutFile.length,
);

/** The expenses tab with these filters, read by `ExpensesView`. */
function expensesWith(filters: Record<string, string>): RouteLocationRaw {
  return { query: { tab: 'expenses', ...filters } };
}

const numbers = (list: readonly number[]) =>
  list.map((n) => `#${n.toString()}`).join(', ');

// A receipt still to come is expected to lack its file: not missing yet.
const missingFiles = computed(() =>
  summary.receiptsWithoutFile.filter(
    (n) => !summary.receiptsPending.includes(n),
  ),
);
const withFile = computed(
  () => summary.receiptCount - summary.receiptsWithoutFile.length,
);

const openPoints = computed(() => {
  const uncategorized = financeStore.display.flagMissingCategories
    ? (summary.byCategory.find((c) => c.categoryId === null)?.count ?? 0)
    : 0;
  return [
    missingFiles.value.length > 0 && {
      key: 'missing-files',
      icon: 'no_photography',
      label: t('finance.filter.missingFile', {
        count: missingFiles.value.length,
      }),
      numbers: numbers(missingFiles.value),
      to: expensesWith({ noFile: 'true' }),
    },
    summary.receiptsPending.length > 0 && {
      key: 'pending',
      icon: 'hourglass_empty',
      label: t('finance.filter.pending', {
        count: summary.receiptsPending.length,
      }),
      numbers: numbers(summary.receiptsPending),
      to: expensesWith({ pending: 'true' }),
    },
    uncategorized > 0 && {
      key: 'no-category',
      icon: 'label_off',
      label: t('finance.filter.missingCategory', { count: uncategorized }),
      numbers: '',
      to: expensesWith({ noCategory: 'true' }),
    },
  ].filter((item) => !!item);
});

function download(kind: 'xlsx' | 'csv' | 'receipts' | 'receiptsByGroup') {
  // Reported by the store.
  financeStore.download(kind).catch(() => undefined);
}

interface Row {
  key: string;
  to: RouteLocationRaw;
  name: string;
  total: number;
  refunds: number;
  count: number;
}

// Totals per category with group subtotals; archived categories still count.
const rows = computed(() => {
  const totals = new Map(summary.byCategory.map((c) => [c.categoryId, c]));
  const toRow = (category: ExpenseCategory): Row | null => {
    const total = totals.get(category.id);
    return total
      ? {
          key: category.id,
          to: expensesWith({ category: category.id }),
          name: to(category.name),
          total: total.total,
          refunds: total.refunds,
          count: total.count,
        }
      : null;
  };

  const groups = groupCategories(categories).map((group) => {
    const list = group.categories
      .map(toRow)
      .filter((row): row is Row => row !== null)
      .sort((a, b) => b.total - a.total);
    return {
      key: group.group?.id ?? 'top',
      name: group.group ? to(group.group.name) : '',
      total: list.reduce((sum, row) => sum + row.total, 0),
      rows: list,
    };
  });

  const uncategorized = totals.get(null);
  if (uncategorized) {
    groups.push({
      key: 'none',
      name: '',
      total: uncategorized.total,
      rows: [
        {
          key: 'none',
          to: expensesWith({ noCategory: 'true' }),
          name: t('finance.summary.uncategorized'),
          total: uncategorized.total,
          refunds: uncategorized.refunds,
          count: uncategorized.count,
        },
      ],
    });
  }

  return groups.filter((group) => group.rows.length > 0);
});

const largest = computed(() =>
  Math.max(1, ...rows.value.flatMap((g) => g.rows.map((r) => r.total))),
);

function barWidth(total: number): number {
  return Math.max(0, (total / largest.value) * 100);
}
</script>

<style scoped>
.summary-view {
  gap: 24px;
}

.export-card {
  background: var(--md3-surface-container);
}

.figures {
  gap: 8px 32px;
}

.group-row {
  background: var(--md3-surface-container-low);
  border-top: 1px solid var(--md3-outline-variant);
}

.category-row {
  color: inherit;
  text-decoration: none;
  display: grid;
  grid-template-columns: minmax(120px, 1.2fr) minmax(0, 2fr) minmax(90px, auto);
  gap: 16px;
  align-items: center;
  border-top: 1px solid var(--md3-outline-variant);
}

.category-row:hover,
.category-row:focus-visible {
  background: var(--md3-surface-container);
}

.category-row--nested {
  padding-left: 32px;
}

.bar-track {
  height: 8px;
  background: var(--md3-surface-container-highest);
  overflow: hidden;
}

.bar-fill {
  height: 8px;
  background: var(--md3-primary);
}

.split-bar {
  height: 12px;
  overflow: hidden;
  gap: 2px;
  background: var(--md3-surface-container-highest);
}

.split-people {
  flex-basis: 0;
  background: var(--md3-primary);
}

.split-funds {
  flex-basis: 0;
  background: var(--md3-tertiary);
}

.legend {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend--people {
  background: var(--md3-primary);
}

.legend--funds {
  background: var(--md3-tertiary);
}

@media (max-width: 599px) {
  .category-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .bar-track {
    display: none;
  }
}
</style>
