<template>
  <!-- id for pdf export -->
  <q-table
    id="print-table"
    v-model:pagination="pagination"
    :columns="columns as QTableColumn[]"
    :rows="rows"
    :rows-per-page-options="[0]"
    :style="style"
    :title="t('title')"
    class="my-sticky-header-table"
    dense
    flat
    hide-bottom
    row-key="name"
    virtual-scroll
  >
    <template #top-right>
      <div class="fit row no-wrap justify-end">
        <!-- Filter -->
        <q-select
          v-if="!printing && countries.length > 1 && !quasar.screen.xs"
          v-model="countryFilter"
          :label="t('filter')"
          :options="countries"
          borderless
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
          :options="templates"
          borderless
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
          v-if="!printing"
          dense
          flat
          icon="more_vert"
        >
          <q-menu>
            <q-list
              class="text-no-wrap"
              style="min-width: 100px"
            >
              <!-- Edit templates -->
              <q-item
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
              <!-- Download -->
              <q-item
                v-close-popup
                clickable
                @click="onPrint()"
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
      :key="key"
      #[`body-cell-${key}`]="rendererProps"
    >
      <q-td :props="rendererProps">
        <table-cell-wrapper
          :renderer="renderer"
          :camp="camp"
          :props="rendererProps as QTableBodyCellProps"
          :printing="printing"
        />
      </q-td>
    </template>
  </q-table>
</template>

<script lang="ts" setup>
import TableComponentRegistry from 'components/campManagement/table/ComponentRegistry';
import { QTableColumn } from 'quasar';
import { CTableTemplate, CTableColumnTemplate } from 'src/types/CTableTemplate';
import { TableCellRenderer } from 'components/campManagement/table/TableCellRenderer';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  CampDetails,
  TableTemplate,
} from '@camp-registration/common/entities';
import { useQuasar } from 'quasar';
import {
  createPDF,
  Dimension,
} from 'components/campManagement/table/export/tableToPdf';

import { useRoute, useRouter } from 'vue-router';
import { ExpressionEvaluator } from 'components/ExpressionEvaluator';
import {
  TableColumnTemplate,
  Registration,
} from '@camp-registration/common/entities';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import TableTemplateIndexDialog from 'components/campManagement/table/dialogs/template/TableTemplateIndexDialog.vue';
import { useTemplateStore } from 'stores/template-store';
import { objectValueByPath } from 'src/utils/objectValueByPath';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import TableCellWrapper from 'components/campManagement/table/TableCellWrapper.vue';
import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';

interface Props {
  questions: TableColumnTemplate[];
  results: Registration[];
  templates: TableTemplate[];
  camp: CampDetails;
}

const props = defineProps<Props>();

const { t, locale } = useI18n();
const quasar = useQuasar();
const route = useRoute();
const router = useRouter();
const { to } = useObjectTranslation();

// TODO emit instead
const templateStore = useTemplateStore();
const registrationAccessor = useRegistrationHelper();

interface Pagination {
  rowsPerPage?: number;
  sortBy?: string;
  descending?: boolean;
}

const pagination = ref<Pagination>({
  rowsPerPage: 0,
  sortBy: undefined,
  descending: undefined,
});

// TODO Set according to preset update

const rows = computed<Registration[]>(() => {
  let rows = props.results;
  // Preset filter
  if (template.value.filter !== undefined) {
    const ex = new ExpressionEvaluator(template.value.filter);
    rows = rows.filter((row) => {
      return ex.evaluate(row);
    });
  }

  // Waiting list
  if (
    template.value.filterWaitingList &&
    template.value.filterWaitingList !== 'include'
  ) {
    const filterValue = template.value.filterWaitingList === 'only';

    rows = rows.filter((row) => {
      return row.waitingList == filterValue;
    });
  }

  // Role
  if (template.value.filterRoles) {
    rows = rows.filter((row) => {
      const roles = row.campData['role'];

      // If no role is set for a given registration, it is assumed that it is a participant registration
      if (template.value.filterRoles?.includes('participant')) {
        if (roles.length === 0 || roles.every((role) => !role)) {
          return false;
        }
      }

      return !template.value.filterRoles?.some((role) => roles.includes(role));
    });
  }

  // Select filter
  if (Array.isArray(countryFilter.value) && countryFilter.value.length > 0) {
    rows = rows.filter((value) => {
      const country = registrationAccessor.country(value);
      return country && countryFilter.value?.includes(country);
    });
  }

  return rows;
});

const countryFilter = ref<string[] | undefined>([]);

const countries = computed<string[]>(() => {
  return props.camp.countries;
});

const templates = computed<CTableTemplate[]>(() => {
  const templates: CTableTemplate[] = props.templates.map((template) => ({
    ...template,
    // Map the columns to access the data with dot notation
    columns: template.columns.map((column) => ({
      ...column,
      field: (row: unknown) => objectValueByPath(column.field as string, row),
    })),
  }));

  // Default template to show all information
  const columns: CTableColumnTemplate[] = props.questions.map((column) => {
    return {
      ...column,
      field: (row: unknown) =>
        objectValueByPath(('data.' + column.field) as string, row),
    };
  });

  templates.push({
    id: '-1',
    title: 'Original (Plain)',
    columns,
    order: 99,
    generated: true,
  });

  return templates.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
});
const template = ref<CTableTemplate>(defaultTemplate());

watch(template, (newValue) => {
  pagination.value.sortBy = newValue.sortBy;
  pagination.value.descending = newValue.sortDirection === 'desc';
});

function defaultTemplate(): CTableTemplate {
  if (route.hash.length > 1) {
    const id = route.hash.substring(1);
    const result = templates.value.find((value) => value.id == id);
    if (result) {
      pagination.value.sortBy = result.sortBy;
      pagination.value.descending = result.sortDirection === 'desc';

      return result;
    }
  }

  return templates.value[0];
}

function onTemplateChange() {
  router.replace({
    hash: `#${template.value?.id}`,
  });
}

const columns = computed<CTableColumnTemplate[]>(() => {
  const columns = [...template.value.columns];

  // Add index column as first column
  if (template.value.indexed) {
    columns.unshift({
      name: '_index',
      field: '',
      label: '',
      align: 'center',
      renderAs: 'index',
      shrink: true,
    });
  }

  // Add actions column at the end
  if (template.value.actions) {
    columns.push({
      name: '_action',
      align: 'center',
      label: '',
      field: '',
      renderAs: 'action',
      shrink: true,
    });
  }

  return columns;
});

const renderers = computed<Map<string, TableCellRenderer>>(() => {
  const rendererMap = new Map<string, TableCellRenderer>();

  columns.value.forEach((column) => {
    // Always use a custom renderer to use renderer options
    column.renderAs ??= 'default';

    const componentEntry = TableComponentRegistry.load(column.renderAs);
    const renderComponent = componentEntry.component;
    // TODO What to do with options?
    if (renderComponent) {
      rendererMap.set(
        column.name,
        new TableCellRenderer(renderComponent, column),
      );
    }
  });

  return rendererMap;
});

// Export
const printing = ref<boolean>(false);
const printDimensions = ref<Dimension>();
const style = computed<string>(() => {
  return printing.value
    ? `min-width: ${printDimensions.value?.width}px; max-width: ${printDimensions.value?.width}px; left: 0`
    : '';
});

async function onPrint() {
  const items = templates.value
    .filter((value) => !value.generated)
    .map((value) => {
      return {
        label: to(value.title),
        value,
      };
    });

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
      // Sort by order
      data = data.sort((a, b) => a.order - b.order);

      printTables(data);
    });
}

async function printTables(templates: CTableTemplate[]) {
  quasar.loading.show();
  printing.value = true;
  quasar.dark.set(false);

  const initialTemplate = template.value;
  try {
    await printTablesCore(templates);
  } catch (e: unknown) {
    quasar.notify({
      type: 'negative',
      message: t('export.pdf.error'),
    });
  } finally {
    // Reset loading
    printing.value = false;
    quasar.dark.set('auto');
    quasar.loading.hide();
    // Reset the template to the initial value
    template.value = initialTemplate;
  }
}

async function printTablesCore(templates: CTableTemplate[]) {
  // Prepare printing
  const pdf = createPDF();

  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dateTimeString = date.toLocaleString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  // Print each page
  for (const printingTemplate of templates) {
    const templateTitle = to(printingTemplate.title);
    quasar.loading.show({
      message: t('export.pdf.loading.template') + ' ' + templateTitle,
    });

    // Update view
    template.value = printingTemplate;
    // Wait for DOM to finish updating the template
    await new Promise<void>((resolve) => nextTick(resolve));

    const { element, width, height, orientation } = prepareTableForExport();

    await pdf.addPage(element, {
      captureHeight: height,
      captureWidth: width,
      scale: 3,
      page: {
        orientation,
        footer: `${t('title')} (${templateTitle}) @ ${dateTimeString}`,
        name: templateTitle,
      },
    });
  }

  quasar.loading.show({
    message: t('export.pdf.loading.saving'),
  });

  const filename = `${year}_${month}_${day}_${t('title')}`;
  pdf.save(filename);
}

function prepareTableForExport() {
  const element = document.querySelector('#print-table') as HTMLElement;
  const table = element.querySelector('table') as HTMLElement;

  // Calculate required height. Height of element does not work somehow.
  const contentHeight =
    table.querySelector('tbody:nth-of-type(2)')?.clientHeight ?? 0;
  const headerHeight = table.querySelector('thead')?.clientHeight ?? 0;
  const marginHeight = 100;
  const height = contentHeight + headerHeight + marginHeight;

  // TODO Take orientation into account
  // Calculate required width.
  table.style.width = 'auto';
  const minWidth = table.clientWidth;
  table.style.width = '100%';
  // Optimize width for ISO 216 pages
  // Ration: 1 / sqrt(2)
  const maxWidth = (height / 2) * Math.sqrt(2);
  // Use maximum with of both to maximise size but still fit everything in
  const width = Math.max(minWidth, maxWidth);

  // Update the dom to the dimensions
  printDimensions.value = {
    width,
    height,
  };

  const orientation = template.value?.printOptions?.orientation;

  return {
    element,
    width,
    height,
    orientation,
  };
}

function editTemplates() {
  quasar
    .dialog({
      component: TableTemplateIndexDialog,
      componentProps: {
        templates: props.templates,
        camp: props.camp,
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
  /* height or max-height is important */
  height: 310px;

  thead tr th {
    position: sticky;
    z-index: 1;
  }

  thead tr:first-child th {
    top: 0;
  }

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th {
    /* height of all previous header rows */
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
