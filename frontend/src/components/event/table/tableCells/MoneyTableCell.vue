<template>
  <span
    v-if="amount === null"
    class="cell-placeholder"
  >
    —
  </span>
  <span
    v-else
    class="money-cell"
    :class="{ 'money-cell--zero': amount === 0 }"
  >
    {{ formatMoney(amount, event.currency, locale) }}
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatMoney } from '@camp-registration/common/utils';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';

// Minor units of the event currency — every amount of an event is in it.
const { props: cellProps, event } = defineProps<TableCellProps>();

const { locale } = useI18n();

const amount = computed<number | null>(() =>
  typeof cellProps.value === 'number' ? cellProps.value : null,
);
</script>

<style scoped>
.money-cell {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.money-cell--zero,
.cell-placeholder {
  color: var(--md3-on-surface-variant);
}
</style>
