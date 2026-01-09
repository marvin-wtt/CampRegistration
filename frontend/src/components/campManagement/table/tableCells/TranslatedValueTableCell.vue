<template>
  {{ value }}
</template>

<script lang="ts" setup>
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { computed } from 'vue';

const { to } = useObjectTranslation();

const { props: cellProps } = defineProps<TableCellProps>();

const value = computed(() => {
  const value = cellProps.value;
  if (isStringOrRecord(value)) {
    return to(value);
  }

  return value;
});

function isStringOrRecord(
  value: unknown,
): value is string | Record<string, string> {
  return (
    typeof value === 'string' || (typeof value === 'object' && value !== null)
  );
}
</script>

<style scoped></style>
