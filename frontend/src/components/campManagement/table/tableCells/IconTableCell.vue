<template>
  <q-icon
    v-if="visible"
    :color="color"
    :name="name"
    :size="size"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();

const visible = computed<boolean>(() => {
  // Visibility should be defined via the showIf / hideIf fields
  // return typeof props.props.value === 'boolean' ? props.props.value : true;
  return true;
});

const color = computed<string>(() => {
  if (
    props.options !== undefined &&
    'color' in props.options &&
    typeof props.options.color === 'string'
  ) {
    return props.options.color;
  }
  return '';
});

const name = computed<string>(() => {
  if (
    props.options !== undefined &&
    'name' in props.options &&
    typeof props.options.name === 'string'
  ) {
    return props.options.name;
  }
  return '';
});

const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
});
</script>

<style scoped></style>
