<template>
  {{ formattedName }}
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';
import { formatPersonName } from 'src/utils/formatters';

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

  return formatPersonName(value);
});
</script>

<style scoped></style>
