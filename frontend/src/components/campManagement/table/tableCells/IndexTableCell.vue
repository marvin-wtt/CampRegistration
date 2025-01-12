<template>
  <b>
    {{ index }}
  </b>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();
const index = computed<number>(() => {
  return props.props.rowIndex + 1;
});
</script>

<style scoped></style>
