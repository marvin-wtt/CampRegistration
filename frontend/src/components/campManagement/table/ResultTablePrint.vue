<template>
  <q-table
    v-model:pagination="pagination"
    :columns="columns as QTableColumn[]"
    :rows
    :rows-per-page-options="[0]"
    :title
    class="print-table"
    dense
    flat
    hide-bottom
    row-key="name"
    binary-state-sort
    :dark="false"
  >
    <template
      v-for="column in columns"
      :key="column.name"
      #[`header-cell-${column.name}`]="columnProps"
    >
      <q-th
        :auto-width="column.shrink"
        :props="columnProps"
        style="vertical-align: bottom"
      >
        <a
          :class="
            'headerVertical' in column && column.headerVertical
              ? 'text-vertical'
              : ''
          "
        >
          {{ to(columnProps.col.label) }}
        </a>
      </q-th>
    </template>

    <template
      v-for="[key, renderer] in renderers"
      :key
      #[`body-cell-${key}`]="rendererProps"
    >
      <q-td
        :props="rendererProps"
        :key
      >
        <table-cell-wrapper
          :renderer
          :camp
          :props="rendererProps as QTableBodyCellProps"
          printing
        />
      </q-td>
    </template>
  </q-table>
</template>

<script lang="ts" setup>
import { type QTableColumn } from 'quasar';
import { useObjectTranslation } from 'src/composables/objectTranslation';

import type {
  CampDetails,
  TableTemplate,
  TableColumnTemplate,
  Registration,
} from '@camp-registration/common/entities';

import TableCellWrapper from 'components/campManagement/table/TableCellWrapper.vue';
import type { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';
import { useResultTableModel } from './useResultTableModel';

const { questions, registrations, template, camp, title } = defineProps<{
  questions: TableColumnTemplate[];
  registrations: Registration[];
  template: TableTemplate;
  camp: CampDetails;
  title?: string | undefined;
}>();

const { to } = useObjectTranslation();

const { pagination, rows, columns, renderers } = useResultTableModel(
  {
    questions,
    registrations,
    templates: [template],
    camp,
  },
  { initialTemplateId: template.id },
);
</script>

<style lang="scss">
.text-vertical {
  vertical-align: bottom;
  writing-mode: vertical-rl;
  transform: rotate(-180deg);
}

.print-table {
  height: auto;

  .q-table__top,
  .q-table__bottom {
    display: none;
  }

  table {
    width: 100%;
  }

  thead tr th {
    position: static;
  }
}
</style>
