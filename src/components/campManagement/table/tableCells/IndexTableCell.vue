<template>
  <b>
    {{ index }}
  </b>
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
const index = computed<number>(() => {
  return props.props.rowIndex + 1;
});
</script>

<style scoped></style>
