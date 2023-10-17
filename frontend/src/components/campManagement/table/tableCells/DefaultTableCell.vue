<template>
  {{ props.props.value }}
</template>

<script lang="ts" setup>
import { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();
</script>

<style scoped></style>
