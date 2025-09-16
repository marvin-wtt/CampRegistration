<template>
  {{ text }}
</template>

<script lang="ts" setup>
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import { computed } from 'vue';
import { FormSelectCache } from 'components/campManagement/table/tableCells/FormSelectCache';
import { useObjectTranslation } from 'src/composables/objectTranslation';

const { props: cellProps, camp } = defineProps<TableCellProps>();
const { to } = useObjectTranslation();

const text = computed<unknown>(() => {
  const value = cellProps.value;
  const path = cellProps.col.fieldName;

  if (!path?.startsWith('data.')) {
    return value;
  }

  if (!value || typeof value !== 'string' || typeof path !== 'string') {
    return value;
  }

  const options = FormSelectCache.get(camp, path.substring(5));
  if (!options || !(value in options)) {
    return value;
  }

  return to(options[value]);
});
</script>

<style scoped></style>
