<template>
  {{ address }}
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const { props: cellProps } = defineProps<TableCellProps>();

const address = computed<string>(() => {
  const value = cellProps.value;
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  let address = '';
  if ('address' in value && typeof value.address === 'string') {
    address += value.address;
  } else if ('street' in value && typeof value.street === 'string') {
    address += value.street;

    if ('nr' in value && typeof value.nr === 'string') {
      address += ' ' + value.nr;
    }
  }

  if ('zip_code' in value && typeof value.zip_code === 'string') {
    address += ', ' + value.zip_code;
  } else if ('zipCode' in value && typeof value.zipCode === 'string') {
    address += ', ' + value.zipCode;
  }

  if ('city' in value && typeof value.city === 'string') {
    address += ' ' + value.city;
  }

  if ('country' in value && typeof value.country === 'string') {
    address += ', ' + value.country;
  }

  return address;
});
</script>

<style scoped></style>
