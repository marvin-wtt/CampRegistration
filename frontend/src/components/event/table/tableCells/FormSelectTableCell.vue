<template>
  {{ text }}
</template>

<script lang="ts" setup>
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';
import { computed } from 'vue';
import { FormSelectCache } from '@/components/event/table/tableCells/FormSelectCache';
import { useObjectTranslation } from '@/composables/objectTranslation';

const { props: cellProps, event } = defineProps<TableCellProps>();
const { to } = useObjectTranslation();

const text = computed<unknown>(() => {
  const value = String(cellProps.value);
  const path = cellProps.col.fieldName;
  if (!path?.startsWith('data.')) {
    return value;
  }

  const options = FormSelectCache.get(event, path.substring(5));
  if (!options || !(value in options)) {
    return cellProps.value;
  }

  return to(options[value]);
});
</script>

<style scoped></style>
