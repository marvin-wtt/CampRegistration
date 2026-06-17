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
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import RegistrationActionList from 'components/campManagement/table/RegistrationActionList.vue';

const { props: cellProps, printing, readonly } = defineProps<TableCellProps>();

const size = computed<string>(() => {
  return cellProps.dense ? 'xs' : 'md';
});
</script>

<style scoped></style>
