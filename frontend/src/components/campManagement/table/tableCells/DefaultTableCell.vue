<template>
  <span
    v-if="gridMode && empty"
    class="cell-placeholder"
  >
    —
  </span>
  <span
    v-else
    class="cell-value"
  >
    {{ cellProps.value }}
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from '@/components/campManagement/table/tableCells/TableCellProps';

const { props: cellProps, gridMode = false } = defineProps<TableCellProps>();

const empty = computed<boolean>(() => {
  const value = cellProps.value;

  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0)
  );
});
</script>

<style scoped>
.cell-placeholder {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}

/* Preserve newlines (e.g. Shift+Enter in the inline editor) instead of
   collapsing them to a single inline line, while still wrapping long lines. */
.cell-value {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
