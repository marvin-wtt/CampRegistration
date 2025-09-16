<template>
  {{ formattedName }}
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { formatPersonName } from 'src/utils/formatters';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const { props: cellProps } = defineProps<TableCellProps>();

const formattedName = computed<string | unknown>(() => {
  const value = cellProps.value;

  if (typeof value !== 'string') {
    return value;
  }

  return formatPersonName(value);
});
</script>

<style scoped></style>
