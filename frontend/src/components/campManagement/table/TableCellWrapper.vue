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
        v-if="renderer.isVisible(props.props.row)"
        :camp="camp"
        :options="renderer.options"
        :printing="printing"
        :props="{
          ...props.props,
          value,
        }"
      />
      <!-- Add non breaking space to remain height constrains -->
      <template v-if="!value"> </template>
    </div>
  </div>

  <!-- Single element -->
  <template v-else>
    <component
      :is="renderer.component"
      v-if="renderer.isVisible(props.props.row)"
      :camp="camp"
      :options="renderer.options"
      :printing="printing"
      :props="props.props"
    />
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { TableCellRenderer } from 'components/campManagement/table/TableCellRenderer';
import type { CampDetails } from '@camp-registration/common/entities';
import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';

interface Props {
  renderer: TableCellRenderer;
  camp: CampDetails;
  printing?: boolean;
  props: QTableBodyCellProps;
}

const props = withDefaults(defineProps<Props>(), {
  isArray: false,
  printing: false,
});

const asArray = computed<boolean>(() => {
  return props.renderer.isArray() && Array.isArray(props.props.value);
});

const arrayValue = computed<unknown[]>(() => {
  return props.props.value as unknown[];
});
</script>

<style scoped></style>
