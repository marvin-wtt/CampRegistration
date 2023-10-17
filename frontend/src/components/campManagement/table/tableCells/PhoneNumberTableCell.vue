<template>
  {{ formattedPhoneNumber }}

  <q-tooltip v-if="formattedPhoneNumber">
    {{ props.props.value }}
  </q-tooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { formatPhoneNumber } from 'src/utils/formatters';
import { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();

const data = computed<object>(() => {
  if (
    'data' in props.props.row &&
    typeof props.props.row.data === 'object' &&
    props.props.row.data
  ) {
    return props.props.row.data;
  }

  return {};
});

const formattedPhoneNumber = computed<string | unknown>(() => {
  const value = props.props.value;

  if (typeof value !== 'string' && typeof value !== 'number') {
    return value;
  }

  // TODO Use accessor instead!!!
  const country =
    'country' in data.value && typeof data.value.country === 'string'
      ? data.value.country
      : undefined;

  return value
    .toString()
    .split(/[,;]+/g)
    .map((value: string) => formatPhoneNumber(value.trim(), country))
    .join(', ');
});
</script>

<style scoped></style>
