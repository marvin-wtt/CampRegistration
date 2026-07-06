<template>
  <div class="icon-cell">
    <q-icon
      v-if="match.icon"
      :size
      :name="match.icon"
      :color="match.color"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from '@/components/campManagement/table/tableCells/TableCellProps';
import type { IconMappingOptions } from '@/components/campManagement/table/tableCells/IconMappingOptions';

const { props: cellProps, options } =
  defineProps<TableCellProps<IconMappingOptions>>();

const match = computed<{ icon: string | undefined; color: string }>(() => {
  const value = cellProps.value;
  const mapping = options?.mappings?.find(
    (m) => String(m.value) === String(value),
  );

  const fallback = options?.fallback;
  // When render options were never configured, fall back to a placeholder so the
  // column isn't blank. Once a fallback is configured, an empty icon is honored
  // as "show nothing".
  const fallbackIcon = fallback ? fallback.icon : 'question_mark';

  return {
    icon: mapping?.icon || fallbackIcon,
    color: mapping?.color || fallback?.color || 'grey',
  };
});

const size = computed<string>(() => {
  return cellProps.dense ? 'xs' : 'md';
});
</script>

<style scoped>
/* Center the icon regardless of the column's text-align and keep it from
   overflowing the cell when the column shrinks (e.g. vertical headers). */
.icon-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5em; /* matches the md icon size so the column never collapses below it */
}
</style>
