<template>
  <q-icon
    v-if="leaveAlone"
    :size="size"
    color="positive"
    name="person"
  />

  <q-icon
    v-else-if="leaveGroup"
    :size="size"
    color="warning"
    name="groups"
  />

  <q-icon
    v-else
    :size="size"
    color="negative"
    name="close"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();

const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
});

const leaveAlone = computed<boolean>(() => {
  const value = props.props.value;

  return value === undefined || value === 2;
});

const leaveGroup = computed<boolean>(() => {
  const value = props.props.value;

  return value !== undefined && value === 1;
});
</script>

<style scoped></style>
