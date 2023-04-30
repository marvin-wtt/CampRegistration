<template>
  {{ props.props.value }}
</template>

<script lang="ts" setup>
import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';

interface Props {
  props: QTableBodyCellProps;
  options?: object;
  printing: boolean;
}

const props = defineProps<Props>();
</script>

<style scoped></style>
