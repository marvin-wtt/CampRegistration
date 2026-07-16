<template>
  <span
    v-if="gridMode && empty"
    class="cell-placeholder"
  >
    —
  </span>
  <!-- Break words in grid mode -->
  <span
    v-else-if="gridMode"
    class="grid-value"
  >
    {{ cellProps.value }}
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

/* Preserve user-typed newlines (e.g. Shift+Enter in the inline editor) but do
   not insert automatic line breaks: long lines stay on one line and are
   clipped/ellipsized by the parent instead of wrapping. */
.cell-value {
  white-space: pre;
}

/* Outside the table grid (row card dialog) there's no fixed cell width to
   clip to: wrap long lines instead of overflowing, while still preserving
   user-typed newlines. */
.grid-value {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
