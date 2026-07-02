<template>
  <!-- This is a simple wrapper around IconMappingTableCell that provides the specific configuration for rendering gender icons. -->
  <icon-mapping-table-cell
    v-bind="props"
    :options="{
      mappings: [
        { value: 'm', icon: 'male', color: 'light-blue-6' },
        { value: 'f', icon: 'female', color: 'pink-4' },
        { value: 'd', icon: 'transgender', color: 'grey-4' },
      ],
    }"
  />
</template>

<script lang="ts" setup>
import type { TableCellProps } from '@/components/campManagement/table/tableCells/TableCellProps';
import IconMappingTableCell from '@/components/campManagement/table/tableCells/IconMappingTableCell.vue';

const props = defineProps<TableCellProps>();
</script>

<style scoped></style>
