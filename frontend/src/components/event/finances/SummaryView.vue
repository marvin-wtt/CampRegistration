<template>
  <div class="column no-wrap summary-view">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-4">
        <div class="stat-tile stat-tile--primary rounded-lg column q-pa-md">
          <span class="text-body2">{{ t('finance.summary.total') }}</span>
          <span class="text-h5 amount">{{ money(summary.total) }}</span>
          <span class="text-caption">
            {{
              t('finance.summary.totalCaption', {
                expenses: money(summary.expenses),
                refunds: money(summary.refunds),
              })
            }}
          </span>
        </div>
      </div>
      <div class="col-12 col-sm-4">
        <div class="stat-tile stat-tile--secondary rounded-lg column q-pa-md">
          <span class="text-body2">{{
            t('finance.balance.owedToPeople')
          }}</span>
          <span class="text-h5 amount">{{ money(summary.owedToPeople) }}</span>
        </div>
      </div>
      <div class="col-12 col-sm-4">
        <div class="stat-tile stat-tile--warning rounded-lg column q-pa-md">
          <span class="text-body2">{{ t('finance.balance.owedToEvent') }}</span>
          <span class="text-h5 amount">{{ money(summary.owedToEvent) }}</span>
        </div>
      </div>
    </div>

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
          <span class="text-weight-medium amount">{{
            money(group.total)
          }}</span>
        </div>
        <div
          v-for="row in group.rows"
          :key="row.key"
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
          <span class="text-right amount">{{ money(row.total) }}</span>
        </div>
      </template>
      <q-separator />
      <q-card-section class="row items-center justify-between">
        <span class="text-subtitle1 text-weight-bold">
          {{ t('finance.summary.total') }}
        </span>
        <span class="text-subtitle1 text-weight-bold amount">
          {{ money(summary.total) }}
        </span>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card
          flat
          bordered
          class="rounded-xl full-height"
        >
          <q-card-section class="column q-gutter-y-sm">
            <span class="text-subtitle1 text-weight-medium">
              {{ t('finance.summary.paidFrom') }}
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
              <span class="row items-center q-gutter-x-xs">
                <span class="legend legend--people" />
                <span
                  >{{ t('finance.summary.people') }}
                  {{ money(summary.paidByPeople) }}</span
                >
              </span>
              <span class="row items-center q-gutter-x-xs">
                <span class="legend legend--funds" />
                <span
                  >{{ t('finance.eventFunds') }}
                  {{ money(summary.paidByFunds) }}</span
                >
              </span>
            </div>
            <span class="text-caption text-on-surface-variant">
              {{ t('finance.summary.gross') }}
            </span>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-card
          flat
          bordered
          class="rounded-xl full-height"
        >
          <q-card-section class="column q-gutter-y-sm">
            <span class="text-subtitle1 text-weight-medium">
              {{ t('finance.summary.receiptFiles') }}
            </span>
            <span class="text-body2">
              {{
                t('finance.summary.filesCount', {
                  withFile:
                    summary.receiptCount - summary.receiptsWithoutFile.length,
                  total: summary.receiptCount,
                })
              }}
            </span>
            <q-banner
              v-if="summary.receiptsWithoutFile.length > 0"
              dense
              rounded
              class="bg-warning-container text-on-warning-container"
            >
              {{
                t('finance.summary.missingFiles', {
                  numbers: summary.receiptsWithoutFile
                    .map((n) => `#${n}`)
                    .join(', '),
                })
              }}
            </q-banner>
            <q-banner
              v-if="summary.receiptsPending.length > 0"
              dense
              rounded
              class="bg-tertiary-container text-on-tertiary-container"
              data-test="finance-summary-pending"
            >
              {{
                t('finance.summary.pending', {
                  numbers: summary.receiptsPending
                    .map((n) => `#${n}`)
                    .join(', '),
                })
              }}
            </q-banner>
            <span class="text-caption text-on-surface-variant">
              {{ t('finance.summary.recordsNote') }}
            </span>
          </q-card-section>
        </q-card>
      </div>
    </div>

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
            tonal
            :disable="
              summary.receiptCount === summary.receiptsWithoutFile.length
            "
            data-test="finance-export-receipts"
            @click="download('receipts')"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  ExpenseCategory,
  FinanceSummary,
} from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
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

function download(kind: 'xlsx' | 'csv' | 'receipts') {
  // Reported by the store.
  financeStore.download(kind).catch(() => undefined);
}

interface Row {
  key: string;
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

.stat-tile {
  background: var(--md3-surface-container);
  gap: 4px;
  height: 100%;
}

.stat-tile--primary {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.stat-tile--secondary {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.stat-tile--warning {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);
}

.amount {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.group-row {
  background: var(--md3-surface-container-low);
  border-top: 1px solid var(--md3-outline-variant);
}

.category-row {
  display: grid;
  grid-template-columns: minmax(120px, 1.2fr) minmax(0, 2fr) minmax(90px, auto);
  gap: 16px;
  align-items: center;
  border-top: 1px solid var(--md3-outline-variant);
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
