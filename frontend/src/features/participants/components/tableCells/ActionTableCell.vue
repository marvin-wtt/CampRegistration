<template>
  <q-btn
    v-if="!printing"
    :size="size"
    dense
    field="edit"
    flat
    icon="more_vert"
    round
  >
    <q-menu auto-close>
      <registration-action-list
        :registration="cellProps.row"
        :readonly="readonly"
      />
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from '@/features/participants/components/tableCells/TableCellProps';
import RegistrationActionList from '@/features/participants/components/RegistrationActionList.vue';

const { props: cellProps, printing, readonly } = defineProps<TableCellProps>();

const size = computed<string>(() => {
  return cellProps.dense ? 'xs' : 'md';
});
</script>

<style scoped></style>
