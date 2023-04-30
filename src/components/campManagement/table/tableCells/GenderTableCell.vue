<template>
  <q-icon
    v-if="icon !== undefined"
    :color="color"
    :name="icon"
    :size="size"
  />

  <a v-else>
    {{ props.props.value }}
  </a>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';

interface Props {
  props: QTableBodyCellProps;
  options?: object;
  printing: boolean;
}

const props = defineProps<Props>();
const icon = computed<string | undefined>(() => {
  return props.props.value === 'm'
    ? 'male'
    : props.props.value === 'f'
    ? 'female'
    : undefined;
});
const color = computed<string | undefined>(() => {
  return props.props.value === 'm'
    ? 'light-blue-6'
    : props.props.value === 'f'
    ? 'pink-4'
    : undefined;
});
const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
});
</script>

<style scoped></style>
