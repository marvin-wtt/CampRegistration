<template>
  {{ value }}
</template>

<script lang="ts" setup>
import { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { computed } from 'vue';

const { to } = useObjectTranslation();

const props = defineProps<TableCellProps>();

const value = computed(() => {
  const value = props.props.value;
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
