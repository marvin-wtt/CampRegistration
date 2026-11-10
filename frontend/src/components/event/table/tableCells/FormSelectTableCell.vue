<template>
  {{ text }}
</template>

<script lang="ts" setup>
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';
import { computed } from 'vue';
import { FormSelectCache } from '@/components/event/table/tableCells/FormSelectCache';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formSelectLabels } from '@/utils/formatters/formSelectLabels';

const { props: cellProps, event } = defineProps<TableCellProps>();
const { to } = useObjectTranslation();

const text = computed<unknown>(() => {
  const path = cellProps.col.fieldName;
  if (!path?.startsWith('data.')) {
    return String(cellProps.value);
  }

  const options = FormSelectCache.get(event, path.substring(5));
  const labels = formSelectLabels(cellProps.value, options);

  return labels ? labels.map(to).join(', ') : cellProps.value;
});
</script>

<style scoped></style>
