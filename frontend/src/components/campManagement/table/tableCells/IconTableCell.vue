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
import type { TableCellProps } from '@/components/campManagement/table/tableCells/TableCellProps';

interface IconOptions {
  color?: string | undefined;
  name?: string | undefined;
}

const props = defineProps<TableCellProps<IconOptions>>();

const visible = computed<boolean>(() => {
  // Visibility should be defined via the showIf / hideIf fields
  // return typeof props.props.value === 'boolean' ? props.props.value : true;
  return true;
});

const color = computed<string | undefined>(() => {
  return props.options?.color;
});

const name = computed<string>(() => {
  return props.options?.name || '';
});

const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
});
</script>

<style scoped></style>
