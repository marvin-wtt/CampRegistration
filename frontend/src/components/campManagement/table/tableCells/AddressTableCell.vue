<template>
  {{ address }}
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();

const address = computed<string>(() => {
  const value = props.props.value;
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  let address = '';
  if ('address' in value) {
    address += value.address;
  } else if ('street' in value) {
    address += value.street;

    if ('nr' in value) {
      address += ' ' + value.nr;
    }
  }

  if ('zip_code' in value) {
    address += ', ' + value.zip_code;
  } else if ('zipCode' in value) {
    address += ', ' + value.zipCode;
  }

  if ('city' in value) {
    address += ' ' + value.city;
  }

  if ('country' in value) {
    address += ', ' + value.country;
  }

  return address;
});
</script>

<style scoped></style>
