<template>
  <q-table
    v-model:pagination="pagination"
    :columns="columns as QTableColumn[]"
    :rows
    :rows-per-page-options="[0]"
    :title="t('title')"
    class="my-sticky-header-table"
    dense
    flat
    hide-bottom
    row-key="name"
    virtual-scroll
    :virtual-scroll-slice-size="10"
    binary-state-sort
  >
    <template #top-right>
      <div class="fit row no-wrap justify-end">
        <!-- Filter -->
        <q-select
          v-if="countries.length > 1 && !quasar.screen.xs"
          v-model="countryFilter"
          :label="t('filter.country')"
          :options="countries"
          borderless
          rounded
          clearable
          dense
          multiple
          style="min-width: 100px"
        >
          <template #prepend>
            <q-avatar icon="filter_list" />
          </template>
        </q-select>

        <!-- Templates -->
        <q-select
          v-model="template"
          :label="t('template')"
          :options="templateOptions"
          borderless
          rounded
          dense
          map-options
          option-label="title"
          option-value="id"
          style="min-width: 150px"
          @update:model-value="onTemplateChange"
        >
          <template #selected-item="scope">
            {{ to(scope.opt.title) }}
          </template>
          <template #option="scope">
            <!-- Custom separator for plain option -->
            <q-separator v-if="scope.opt.id === '-1'" />

            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>
                  {{ to(scope.opt.title) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <q-btn
          dense
          flat
          round
          icon="more_vert"
        >
          <q-menu>
            <q-list
              class="text-no-wrap"
              style="min-width: 100px"
            >
              <!-- Edit templates -->
              <q-item
                v-if="
                  can('camp.table_templates.create') ||
                  can('camp.table_templates.edit') ||
                  can('camp.table_templates.delete')
                "
                v-close-popup
                clickable
                @click="editTemplates"
              >
                <q-item-section avatar>
                  <q-icon name="edit" />
                </q-item-section>
                <q-item-section>
                  {{ t('menu.edit_templates') }}
                </q-item-section>
              </q-item>

              <q-separator />

              <!-- Print -->
              <q-item
                v-close-popup
                clickable
                @click="openPrintDialog"
              >
                <q-item-section avatar>
                  <q-icon name="print" />
                </q-item-section>
                <q-item-section>
                  {{ t('menu.print') }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </template>

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
        />
      </q-td>
    </template>
  </q-table>
</template>

<script lang="ts" setup>
import { type QTableColumn, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type {
  CampDetails,
  TableTemplate,
  TableColumnTemplate,
  Registration,
} from '@camp-registration/common/entities';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { usePermissions } from 'src/composables/permissions';
import { useTemplateStore } from 'stores/template-store';
import TableTemplateIndexDialog from 'components/campManagement/table/dialogs/TableTemplateIndexDialog.vue';
import TableCellWrapper from 'components/campManagement/table/TableCellWrapper.vue';
import type { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';
import { useResultTableModel } from './useResultTableModel';
import PrintTableDialog from 'components/campManagement/table/dialogs/PrintTableDialog.vue';

const { questions, registrations, templates, camp } = defineProps<{
  questions: TableColumnTemplate[];
  registrations: Registration[];
  templates: TableTemplate[];
  camp: CampDetails;
}>();

const emit = defineEmits<{
  (e: 'export', templateIds: string[]): void;
}>();

const { t } = useI18n();
const quasar = useQuasar();
const route = useRoute();
const router = useRouter();
const { to } = useObjectTranslation();
const { can } = usePermissions();

const templateStore = useTemplateStore();

const {
  pagination,
  templateOptions,
  template,
  rows,
  columns,
  renderers,
  countryFilter,
  countries,
} = useResultTableModel(
  {
    questions,
    registrations,
    templates,
    camp,
  },
  {
    initialTemplateId: route.hash.length > 1 ? route.hash.substring(1) : null,
  },
);

function onTemplateChange() {
  router.replace({ hash: `#${template.value?.id}` });
}

function openPrintDialog() {
  quasar
    .dialog({
      component: PrintTableDialog,
      componentProps: {
        templates,
      },
    })
    .onOk((data: string[]) => {
      emit('export', data);
    });
}

function editTemplates() {
  quasar
    .dialog({
      component: TableTemplateIndexDialog,
      componentProps: {
        templates,
        camp,
      },
    })
    .onOk((payload: TableTemplate[]) => {
      templateStore.updateCollection(payload);
    });
}
</script>

<style lang="scss">
.text-vertical {
  vertical-align: bottom;
  writing-mode: vertical-rl;
  transform: rotate(-180deg);
}

.body--light {
  .my-sticky-header-table {
    .q-table__top,
    .q-table__bottom,
    thead tr:first-child th {
      background-color: #fff;
    }
  }
}

.body--dark {
  .my-sticky-header-table {
    .q-table__top,
    .q-table__bottom,
    thead tr:first-child th {
      background-color: var(--q-dark);
    }
  }
}

.my-sticky-header-table {
  height: 310px;

  thead tr th {
    position: sticky;
    z-index: 1;
  }

  thead tr:first-child th {
    top: 0;
  }

  &.q-table--loading thead tr:last-child th {
    top: 48px;
  }
}
</style>

<i18n lang="yaml" locale="en">
template: 'Template'
title: 'Participants'

menu:
  print: 'Print tables'
  edit_templates: 'Edit templates'

filter:
  country: 'Country'
</i18n>

<i18n lang="yaml" locale="de">
template: 'Vorlage'
title: 'Teilnehmende'

menu:
  print: 'Tabellen drucken'
  edit_templates: 'Vorlagen bearbeiten'

filter:
  country: 'Land'
</i18n>

<i18n lang="yaml" locale="fr">
template: 'Modèle'
title: 'Participants'

menu:
  print: 'Imprimer les tableaux'
  edit_templates: 'Modifier les modèles'

filter:
  country: 'Pays'
</i18n>

<i18n lang="yaml" locale="pl">
template: 'Szablon'
title: 'Uczestnicy'

menu:
  print: 'Wydrukuj tabele'
  edit_templates: 'Edytuj szablony'

filter:
  country: 'Kraj'
</i18n>

<i18n lang="yaml" locale="cs">
template: 'Šablona'
title: 'Účastníci'

menu:
  print: 'Tisknout tabulky'
  edit_templates: 'Upravit šablony'

filter:
  country: 'Země'
</i18n>
