<template>
  <q-icon
    v-if="leaveAlone"
    :size
    color="positive"
    name="person"
  />

  <q-icon
    v-else-if="leaveGroup"
    :size
    color="warning"
    name="groups"
  />

  <q-icon
    v-else-if="leaveNone"
    :size
    color="negative"
    name="close"
  />

  <q-icon
    v-else
    :size
    color="grey"
    name="question_mark"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const { props: cellProps } = defineProps<TableCellProps>();

const size = computed<string>(() => {
  return cellProps.dense ? 'xs' : 'md';
});

const leaveAlone = computed<boolean>(() => {
  return cellProps.value === 2 || cellProps.value === 'alone';
});

const leaveGroup = computed<boolean>(() => {
  return cellProps.value === 1 || cellProps.value === 'group';
});

const leaveNone = computed<boolean>(() => {
  return cellProps.value === 0 || cellProps.value === 'none';
});
</script>

<style scoped></style>
