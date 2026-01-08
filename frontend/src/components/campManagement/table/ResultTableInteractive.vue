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
          @update:model-value="onTemplateChange()"
        >
          <template #selected-item="scope">
            {{ to(scope.opt.title) }}
          </template>
          <template #option="scope">
            <!-- Custom separator for plain option -->
            <q-separator v-if="scope.opt.id === -1" />

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

              <!-- Export -->
              <q-item
                v-close-popup
                clickable
                @click="openExportDialog"
              >
                <q-item-section avatar>
                  <q-icon name="download" />
                </q-item-section>
                <q-item-section>
                  {{ t('menu.download') }}
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
import type { CTableTemplate } from 'src/types/CTableTemplate';

import { useResultTableModel } from './useResultTableModel';

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

function openExportDialog() {
  const items = templateOptions.value
    .filter((value) => !value.generated)
    .map((value) => ({
      label: to(value.title),
      value,
    }));

  quasar
    .dialog({
      title: t('export.dialog.title'),
      message: t('export.dialog.message'),
      options: {
        type: 'checkbox',
        model: [template.value],
        items,
        color: 'primary',
      },
      ok: {
        color: 'primary',
        rounded: true,
        label: t('export.dialog.download'),
        icon: 'download',
      },
      cancel: {
        color: 'primary',
        rounded: true,
        outline: true,
        label: t('export.dialog.cancel'),
      },
      persistent: true,
    })
    .onOk((data: CTableTemplate[]) => {
      const templateIds = data
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
        .map((value) => value.id);

      emit('export', templateIds);
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
  download: 'Download Table'
  edit_templates: 'Edit templates'

filter:
  country: 'Country'

export:
  dialog:
    title: 'Export tables'
    message: 'Select which tables to export'
    download: 'Download'
    cancel: 'Cancel'
  pdf:
    loading:
      template: 'Preparing template: '
      save: 'Saving table(s) to file...'
    error: 'Failed to export table(s)'
</i18n>

<i18n lang="yaml" locale="de">
template: 'Vorlage'
title: 'Teilnehmende'

menu:
  download: 'Tabelle herunterladen'
  edit_templates: 'Vorlagen bearbeiten'

filter:
  country: 'Land'

export:
  dialog:
    title: 'Tabellen exportieren'
    message: 'Wählen Sie aus, welche Tabellen exportiert werden sollen'
    download: 'Herunterladen'
    cancel: 'Abbrechen'
  pdf:
    loading:
      template: 'Vorlage wird vorbereitet: '
      save: 'Tabelle(n) werden in Datei gespeichert...'
    error: 'Fehler beim Exportieren der Tabelle(n)'
</i18n>

<i18n lang="yaml" locale="fr">
template: 'Modèle'
title: 'Participants'

menu:
  download: 'Télécharger le tableau'
  edit_templates: 'Modifier les modèles'

filter:
  country: 'Pays'

export:
  dialog:
    title: 'Exporter les tables'
    message: 'Sélectionnez les tables à exporter'
    download: 'Télécharger'
    cancel: 'Annuler'
  pdf:
    loading:
      template: 'Préparation du modèle : '
      save: 'Enregistrement de(s) table(s) dans le fichier...'
    error: "Échec de l'exportation de(s) table(s)"
</i18n>

<i18n lang="yaml" locale="pl">
template: 'Szablon'
title: 'Uczestnicy'

menu:
  download: 'Pobierz tabelę'
  edit_templates: 'Edytuj szablony'

filter:
  country: 'Kraj'

export:
  dialog:
    title: 'Eksportuj tabele'
    message: 'Wybierz, które tabele chcesz wyeksportować'
    download: 'Pobierz'
    cancel: 'Anuluj'
  pdf:
    loading:
      template: 'Przygotowywanie szablonu: '
      save: 'Zapisywanie tabel(i) do pliku...'
    error: 'Błąd podczas eksportowania tabel(i)'
</i18n>

<i18n lang="yaml" locale="cs">
template: 'Šablona'
title: 'Účastníci'

menu:
  download: 'Stáhnout tabulku'
  edit_templates: 'Upravit šablony'

filter:
  country: 'Země'

export:
  dialog:
    title: 'Export tabulek'
    message: 'Vyberte, které tabulky chcete exportovat'
    download: 'Stáhnout'
    cancel: 'Zrušit'
  pdf:
    loading:
      template: 'Připravuji šablonu: '
      save: 'Ukládám tabulku(y) do souboru...'
    error: 'Chyba při exportu tabulky/tabulek'
</i18n>
