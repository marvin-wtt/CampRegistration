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
          :event
          :props="rendererProps as QTableBodyCellProps<unknown, Registration>"
          printing
        />
      </q-td>
    </template>
  </q-table>

  <!-- A page that ends without this line continues on the next one. -->
  <div class="print-table-end">
    {{ t('end', { title: title ?? '', count: rows.length }) }}
  </div>
</template>

<script lang="ts" setup>
import { type QTableColumn } from 'quasar';
import { useObjectTranslation } from '@/composables/objectTranslation';

import type {
  EventDetails,
  TableTemplate,
  TableColumnTemplate,
  Registration,
} from '@camp-registration/common/entities';

import TableCellWrapper from '@/features/participants/components/TableCellWrapper.vue';
import type { QTableBodyCellProps } from '@/types/quasar/QTableBodyCellProps';
import { useResultTableModel } from './useResultTableModel';
import { toRef } from 'vue';
import { useI18n } from 'vue-i18n';

const { questions, registrations, template, event, title } = defineProps<{
  questions: TableColumnTemplate[];
  registrations: Registration[];
  template: TableTemplate;
  event: EventDetails;
  title?: string | undefined;
}>();

const { t } = useI18n();
const { to } = useObjectTranslation();

const { pagination, rows, columns, renderers } = useResultTableModel(
  {
    questions: toRef(() => questions),
    registrations: toRef(() => registrations),
    templates: toRef(() => [template]),
    event: toRef(() => event),
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
  background: white;

  .q-table__top,
  .q-table__bottom {
    display: none;
  }

  table {
    width: 100%;
  }

  thead tr th {
    position: static;
    background: white;
  }

  // Never split a single row across a page boundary.
  tbody tr,
  thead tr {
    break-inside: avoid;
    page-break-inside: avoid; // legacy fallback
  }
}
</style>

<style lang="scss" scoped>
.print-table-end {
  margin-top: 2mm;
  padding-top: 1.5mm;
  border-top: 1px solid rgba(0, 0, 0, 0.3);
  font-size: 9pt;
  font-style: italic;
  opacity: 0.75;
  text-align: center;
  // Keep it on the page of the last row, never alone on a new page.
  break-before: avoid;
  page-break-before: avoid;
}
</style>

<i18n lang="yaml" locale="en">
end: 'End of {title} · Entries: {count}'
</i18n>

<i18n lang="yaml" locale="de">
end: 'Ende von {title} · Einträge: {count}'
</i18n>

<i18n lang="yaml" locale="fr">
end: 'Fin de {title} · Entrées : {count}'
</i18n>

<i18n lang="yaml" locale="pl">
end: 'Koniec: {title} · Wpisy: {count}'
</i18n>

<i18n lang="yaml" locale="cs">
end: 'Konec: {title} · Záznamy: {count}'
</i18n>
