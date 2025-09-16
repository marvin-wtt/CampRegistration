<template>
  {{ cellProps.value }}
</template>

<script lang="ts" setup>
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const { props: cellProps } = defineProps<TableCellProps>();
</script>

<style scoped></style>
