<template>
  {{ formattedPhoneNumber }}

  <q-tooltip>
    {{ props.props.value }}
  </q-tooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { formatPhoneNumber } from 'src/utils/formatters';
import { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();

const formattedPhoneNumber = computed<string | unknown>(() => {
  const value = props.props.value;

  if (typeof value !== 'string' && typeof value !== 'number') {
    return value;
  }

  const country =
    'country' in props.props.row && typeof props.props.row.country === 'string'
      ? props.props.row.country
      : undefined;

  return value
    .toString()
    .split(/[,;]+/g)
    .map((value: string) => formatPhoneNumber(value.trim(), country))
    .join(', ');
});
</script>

<style scoped></style>
