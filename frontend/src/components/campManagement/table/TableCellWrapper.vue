<template>
  <!-- TODO Add inline editor -->

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
        :camp="camp"
        :options="renderer.options"
        :printing="printing"
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
      :camp="camp"
      :options="renderer.options"
      :printing="printing"
      :props="cellProps"
    />
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellRenderer } from 'components/campManagement/table/TableCellRenderer';
import type { CampDetails } from '@camp-registration/common/entities';
import type { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';

const {
  renderer,
  camp,
  props: cellProps,
  printing = false,
} = defineProps<{
  renderer: TableCellRenderer;
  camp: CampDetails;
  printing?: boolean;
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
