<template>
  {{ formattedName }}
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
const formattedName = computed<string | unknown>(() => {
  const value = props.props.value;

  if (typeof value !== 'string') {
    return value;
  }

  return value
    .toLowerCase()
    .replace(/(^|\s|-)(\w)/g, (match: string, p1: string, p2: string) => {
      return p1 + p2.toUpperCase();
    });
});
</script>

<style scoped></style>
