<template>
  {{ date }}
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();
const { d } = useI18n();

const date = computed(() => {
  const value = props.props.value;
  if (typeof value !== 'string' && typeof value !== 'number') {
    return props.props.value;
  }

  return d(value, {
    dateStyle: 'medium',
  });
});
</script>

<style scoped></style>
