<template>
  <q-icon
    :color="color"
    :name="name"
    :size="size"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';

interface Props {
  props: QTableBodyCellProps;
  options?: object;
  printing: boolean;
}

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

const props = defineProps<Props>();

const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
});
</script>

<style scoped></style>
