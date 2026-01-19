<template>
  <b>
    {{ index }}
  </b>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const { props: cellProps } = defineProps<TableCellProps>();
const index = computed<number>(() => {
  return cellProps.rowIndex + 1;
});
</script>

<style scoped></style>
