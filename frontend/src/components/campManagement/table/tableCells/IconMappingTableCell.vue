<template>
  <q-icon
    :size
    :name="match.icon"
    :color="match.color"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

interface IconMapping {
  value: string | number;
  icon: string;
  color: string;
}

interface IconMappingOptions {
  mappings?: IconMapping[];
  fallback?: { icon?: string; color?: string } | undefined;
}

const { props: cellProps, options } = defineProps<TableCellProps>();

const config = computed<IconMappingOptions>(() => {
  return options as IconMappingOptions;
});

const match = computed<{ icon: string; color: string }>(() => {
  const value = cellProps.value;
  const mapping = config.value.mappings?.find(
    (m) => String(m.value) === String(value),
  );

  return {
    icon: mapping?.icon ?? config.value.fallback?.icon ?? 'question_mark',
    color: mapping?.color ?? config.value.fallback?.color ?? 'grey',
  };
});

const size = computed<string>(() => {
  return cellProps.dense ? 'xs' : 'md';
});
</script>

<style scoped></style>
