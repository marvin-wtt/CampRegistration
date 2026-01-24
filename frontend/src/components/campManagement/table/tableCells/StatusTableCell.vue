<template>
  <q-icon
    v-if="status === 'WAITLISTED'"
    :size
    color="warning"
    name="schedule"
  />

  <q-icon
    v-else-if="status === 'PENDING'"
    :size
    color="warning"
    name="hourglass_top"
  />

  <q-icon
    v-else-if="status === 'ACCEPTED'"
    :size
    color="positive"
    name="check"
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

const status = computed(() => {
  return cellProps.value;
});

const size = computed<string>(() => {
  return cellProps.dense ? 'xs' : 'md';
});
</script>

<style scoped></style>
