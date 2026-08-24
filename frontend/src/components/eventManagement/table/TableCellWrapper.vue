<template>
  <!-- Array of elements -->
  <div
    v-if="asArray"
    class="column no-wrap"
  >
    <div
      v-for="(value, i) in arrayValue"
      :key="i"
    >
      <component
        :is="renderer.component"
        v-if="renderer.isVisible(cellProps.row)"
        :event
        :options="renderer.options"
        :printing
        :grid-mode="gridMode"
        :props="{
          ...cellProps,
          value,
        }"
      />
      <!-- Add non breaking space to remain height constrains -->
      <!-- eslint-disable-next-line no-irregular-whitespace -->
      <template v-if="!value"> </template>
    </div>
  </div>

  <!-- Single element -->
  <template v-else>
    <component
      :is="renderer.component"
      v-if="renderer.isVisible(cellProps.row)"
      :event
      :options="renderer.options"
      :printing
      :grid-mode="gridMode"
      :props="cellProps"
    />
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellRenderer } from '@/components/eventManagement/table/TableCellRenderer';
import type { EventDetails } from '@camp-registration/common/entities';
import type { QTableBodyCellProps } from '@/types/quasar/QTableBodyCellProps';

const {
  renderer,
  event,
  props: cellProps,
  printing = false,
  gridMode = false,
} = defineProps<{
  renderer: TableCellRenderer;
  event: EventDetails;
  printing?: boolean;
  gridMode?: boolean;
  props: QTableBodyCellProps;
}>();

const asArray = computed<boolean>(() => {
  return renderer.isArray() && Array.isArray(cellProps.value);
});

const arrayValue = computed<unknown[]>(() => {
  return cellProps.value as unknown[];
});
</script>

<style scoped></style>
