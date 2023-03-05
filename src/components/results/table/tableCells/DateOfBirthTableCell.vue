<template>
  {{ date }}
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';

interface Props {
  props: QTableBodyCellProps;
  options?: object;
  printing: boolean;
}

const props = defineProps<Props>();

const { d } = useI18n();

const date = computed(() => {
  const value = props.props.value;
  if (typeof value !== 'string' && typeof value !== 'number') {
    return props.props.value;
  }

  return d(value);
});
</script>

<style scoped></style>
