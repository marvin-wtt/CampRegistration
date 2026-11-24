<template>
  <!-- Amounts per category with their share of the total; a group shows
       its subtotal, its categories indented below. Rows lead to records. -->
  <q-card
    flat
    bordered
    class="rounded-xl column no-wrap"
  >
    <q-card-section class="text-subtitle1 text-weight-medium">
      {{ title }}
    </q-card-section>

    <div
      v-if="groups.length === 0"
      class="q-px-md q-pb-md text-body2 text-on-surface-variant"
    >
      {{ empty }}
    </div>

    <template
      v-for="group in groups"
      :key="group.key"
    >
      <div
        v-if="group.name"
        class="total-row group-row q-px-md q-py-sm"
      >
        <span class="text-weight-medium ellipsis">{{ group.name }}</span>
        <span class="share text-on-surface-variant">
          {{ share(group.total) }}
        </span>
        <span class="text-weight-medium text-amount text-right">
          {{ money(group.total) }}
        </span>
      </div>
      <router-link
        v-for="row in group.rows"
        :key="row.key"
        :to="row.to"
        class="total-row category-row q-px-md q-py-sm"
        :class="{ 'category-row--nested': !!group.name }"
      >
        <div class="column min-width-0">
          <span class="ellipsis">{{ row.name }}</span>
          <span
            v-if="row.caption"
            class="text-caption text-on-surface-variant ellipsis"
          >
            {{ row.caption }}
          </span>
        </div>
        <!-- A nested row is part of its group's share; another currency
             has none. -->
        <span class="share text-on-surface-variant">
          {{ group.name || row.currency ? '' : share(row.total) }}
        </span>
        <span class="text-right text-amount">
          {{ money(row.total, row.currency) }}
        </span>
      </router-link>
    </template>

    <q-space />
    <q-separator />
    <q-card-section class="column q-gutter-y-xs">
      <div class="row items-center justify-between no-wrap">
        <span class="text-subtitle1 text-weight-bold">{{ totalLabel }}</span>
        <span class="text-subtitle1 text-weight-bold text-amount">
          {{ money(total) }}
        </span>
      </div>
      <slot name="footer" />
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFinanceFormat } from '@/composables/financeFormat';
import type { CategoryTotalGroup } from '@/types/categoryTotals';

const { total } = defineProps<{
  title: string;
  empty: string;
  groups: readonly CategoryTotalGroup[];
  total: number;
  totalLabel: string;
}>();

const { locale } = useI18n();
const { money } = useFinanceFormat();

// Whole percent: enough to compare, and no noise.
const percent = computed(
  () =>
    new Intl.NumberFormat(locale.value, {
      style: 'percent',
      maximumFractionDigits: 0,
    }),
);

function share(amount: number): string {
  return total > 0 ? percent.value.format(amount / total) : '';
}
</script>

<style scoped>
.total-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 48px minmax(80px, auto);
  gap: 12px;
  align-items: center;
  border-top: 1px solid var(--md3-outline-variant);
}

.group-row {
  background: var(--md3-surface-container-low);
}

.category-row {
  color: inherit;
  text-decoration: none;
}

.category-row:hover,
.category-row:focus-visible {
  background: var(--md3-surface-container);
}

.category-row--nested {
  padding-left: 32px;
}

.share {
  font-size: 0.8125rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.min-width-0 {
  min-width: 0;
}
</style>
