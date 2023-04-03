<template>
  <!-- id for pdf export -->
  <q-table
    id="print-table"
    v-model:pagination="pagination"
    :columns="columns"
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
    <template v-slot:top-right>
      <div class="fit row no-wrap justify-end">
        <!-- Filter -->
        <q-select
          v-if="!printing && !quasar.screen.xs"
          v-model="countryFilter"
          :label="t('filter')"
          :options="countries"
          borderless
          clearable
          dense
          multiple
          style="min-width: 100px"
        >
          <template v-slot:prepend>
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
          <template v-slot:selected-item="scope">
            {{ to(scope.opt.title) }}
          </template>
          <template v-slot:option="scope">
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
                :to="{ name: 'results-participants-templates' }"
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
                @click="exportPDF()"
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
      v-slot:[`header-cell-${column.name}`]="props"
    >
      <q-th
        :auto-width="column.shrink"
        :props="props"
        style="vertical-align: bottom"
      >
        <a
          :class="
            'headerVertical' in column && column.headerVertical
              ? 'text-vertical'
              : ''
          "
        >
          {{ to(props.col.label) }}
        </a>
      </q-th>
    </template>

    <template
      v-for="[key, renderer] in renderers"
      :key="key"
      v-slot:[`body-cell-${key}`]="props"
    >
      <q-td :props="props">
        <component
          :is="renderer.component"
          v-if="renderer.isVisible(props.row)"
          :options="renderer.options"
          :printing="printing"
          :props="props"
        />
      </q-td>
    </template>
  </q-table>
</template>

<script lang="ts" setup>
import { ComponentRegistry } from 'components/results/table/ComponentRegistry';
import { QTableColumn } from 'src/types/quasar/QTableColum';
import { TableCellRenderer } from 'components/results/table/TableCellRenderer';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { TableTemplate } from 'src/types/TableTemplate';
import { useQuasar } from 'quasar';
import {
  createPDF,
  Dimension,
} from 'components/results/table/export/tableToPdf';

import { useRoute, useRouter } from 'vue-router';
import { ExpressionEvaluator } from 'components/results/table/ExpressionEvaluator';
import { TableColumnTemplate } from 'src/types/TableColumnTemplate';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { Registration } from 'src/types/Registration';
import EditResultTemplatesDialog from 'components/results/dialogs/template/EditResultTemplatesDialog.vue';
import { Camp } from 'src/types/Camp';

interface Props {
  questions: QTableColumn[];
  results: Registration[];
  templates: TableTemplate[];
  camp: Camp;
}

const props = defineProps<Props>();

const { t, locale } = useI18n();
const quasar = useQuasar();
const route = useRoute();
const router = useRouter();
const { to } = useObjectTranslation();

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
    rows = props.results.filter((row) => {
      return ex.evaluate(row);
    });
  }

  // Select filter
  if (Array.isArray(countryFilter.value) && countryFilter.value.length > 0) {
    rows = props.results.filter((value) => {
      return (
        'country' in value &&
        typeof value.country === 'string' &&
        countryFilter.value &&
        countryFilter.value.includes(value.country)
      );
    });
  }

  return rows;
});

const countryFilter = ref<string[] | undefined>([]);

const countries = computed<string[]>(() => {
  return [
    ...new Set(
      props.results.map((value) => {
        return 'country' in value ? (value.country as string) : '';
      })
    ),
  ];
});

const templates = computed<TableTemplate[]>(() => {
  const templates = [...props.templates];
  templates.push({
    id: '-1',
    title: 'Original (Plain)',
    columns: props.questions,
    order: 99,
  });

  return templates.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
});
const template = ref<TableTemplate>(defaultTemplate());

watch(template, (newValue) => {
  pagination.value.sortBy = newValue.sortBy;
  pagination.value.descending = newValue.sortDirection === 'desc';
});

function defaultTemplate(): TableTemplate {
  if (route.hash.length > 1) {
    const id = route.hash.substring(1);
    const result = templates.value.find((value) => value.id == id);
    if (result) {
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

const columns = computed<TableColumnTemplate[]>(() => {
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

    const renderComponent = ComponentRegistry.INSTANCE.getComponent(
      column.renderAs
    );
    if (renderComponent) {
      rendererMap.set(
        column.name,
        new TableCellRenderer(renderComponent, column)
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

async function exportPDF() {
  // Remove unwanted elements
  printing.value = true;
  const element = document.querySelector('#print-table') as HTMLElement;
  const table = element.querySelector('table') as HTMLElement;

  // Calculate required height. Height of element does not work somehow.
  const contentHeight =
    table.querySelector('tbody:nth-of-type(2)')?.clientHeight ?? 0;
  const headerHeight = table.querySelector('thead')?.clientHeight ?? 0;
  const marginHeight = 100;
  const height = contentHeight + headerHeight + marginHeight;

  // Calculate required width.
  table.style.width = 'auto';
  const minWidth = table.clientWidth;
  table.style.width = '100%';
  // Optimize width for ISO 216 pages
  // Ration: 1 / sqrt(2)
  const maxWidth = (height / 2) * Math.sqrt(2);
  // Use maximum with of both to maximise size but still fit everything in
  const width = Math.max(minWidth, maxWidth);

  const pageOrientation = template.value?.printOptions?.orientation;

  printDimensions.value = {
    width: width,
    height: height,
  };

  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const templateTitle = to(template.value.title);

  const dateTimeString = date.toLocaleString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  quasar.loading.show();
  quasar.dark.set(false);

  try {
    await createPDF(element, {
      captureHeight: height,
      captureWidth: width,
      scale: 3,
      page: {
        orientation: pageOrientation,
        footer: `${t('title')} (${templateTitle}) @ ${dateTimeString}`,
        name: `${year}_${month}_${day}_${t('title')}_${templateTitle}`,
      },
    });
  } catch (e: unknown) {
    console.error('oops, something went wrong!', e);
  } finally {
    printing.value = false;
    quasar.dark.set('auto');
    quasar.loading.hide();
  }
}

function editTemplates() {
  quasar
    .dialog({
      component: EditResultTemplatesDialog,
      componentProps: {
        templates: templates.value,
        camp: props.camp,
      },
    })
    .onOk((payload: TableTemplate[]) => {
      // TODO Update store
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
template: Template
title: Participants
menu:
  download: Download Table
  edit_templates: Edit templates
</i18n>

<i18n lang="yaml" locale="de">
template: Vorlage
title: Teilnehmende
menu:
  download: Tabelle herunterladen
  edit_templates: Vorlagen bearbeiten
</i18n>

<i18n lang="yaml" locale="fr">
template: Modèle
title: Participants
menu:
  download: Télécharger le tableau
  edit_templates: Modifier les modèles
</i18n>
