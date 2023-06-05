<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card
      class="q-dialog-plugin q-pb-none row justify-between content-start"
      :style="`min-width: ${minWidth}px`"
    >
      <q-card-section class="col-12">
        <div class="text-h5">
          {{ t('title') }}
        </div>
      </q-card-section>

      <q-card-section class="col-12 col-md-5 q-pt-none q-gutter-y-sm column">
        <translated-input
          v-model="template.title"
          :label="t('fields.title.label')"
          :hint="t('fields.title.hint')"
          hide-bottom-space
          outlined
          rounded
          :locales="props.camp.countries"
        />

        <a class="text-h6">
          {{ t('sections.sort') }}
        </a>

        <q-select
          v-model="template.sortBy"
          :label="t('fields.sortBy.label')"
          :hint="t('fields.sortBy.hint')"
          :options="sortByOptions"
          emit-value
          hide-bottom-space
          outlined
          rounded
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ to(scope.opt.label) }}</q-item-label>
                <q-item-label caption>{{ scope.opt.value }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>

          <template #append>
            <q-icon
              v-if="template.sortBy"
              name="close"
              class="cursor-pointer"
              @click.stop.prevent="template.sortBy = undefined"
            />
          </template>

          <template #after>
            <q-btn
              v-if="template.sortBy"
              :icon="
                template.sortDirection === 'asc'
                  ? 'arrow_upward'
                  : 'arrow_downward'
              "
              round
              outline
              @click="swapSortDirection"
            />
          </template>
        </q-select>

        <a class="text-h6">
          {{ t('sections.filter') }}
        </a>

        <q-toggle
          v-model="template.filterWaitingList"
          :label="t('fields.filter_waiting_list.label')"
        />

        <q-toggle
          v-model="template.filterParticipants"
          :label="t('fields.filter_participants.label')"
        />

        <q-toggle
          v-model="template.filterLeaders"
          :label="t('fields.filter_leaders.label')"
        />

        <q-input
          v-model="template.filter"
          :label="t('fields.filter.label')"
          :hint="t('fields.filter.hint')"
          clearable
          outlined
          rounded
        />

        <q-separator class="lt-md" />
      </q-card-section>

      <q-card-section class="col-12 col-md-7 q-pt-none q-gutter-y-sm column">
        <a class="text-h6">
          {{ t('sections.columns') }}
        </a>

        <q-toggle
          v-model="template.indexed"
          :label="t('fields.indexed.label')"
        />

        <q-toggle
          v-model="template.actions"
          :label="t('fields.actions.label')"
        />

        <sortable-list
          v-slot="slotProps"
          v-model="template.columns"
          addable
          editable
          deletable
          bordered
          separator
          dense
          @edit="(item) => editColumn(item)"
          @add="addColumn"
        >
          <q-item-section>
            <q-item-label>
              {{ to(slotProps.item.label) }}
            </q-item-label>
            <q-item-label caption>
              {{ slotProps.item.name }}
            </q-item-label>
          </q-item-section>
        </sortable-list>
      </q-card-section>

      <!-- action buttons -->
      <q-card-actions
        class="col-12"
        align="right"
      >
        <q-btn
          outline
          rounded
          color="primary"
          :label="t('actions.cancel')"
          @click="onDialogCancel"
        />
        <q-btn
          rounded
          color="primary"
          :label="t('actions.ok')"
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { TableTemplate } from 'src/types/TableTemplate';
import TranslatedInput from 'components/TranslatedInput.vue';
import { computed, reactive, toRaw } from 'vue';
import SortableList from 'components/SortableList.vue';
import { TableColumnTemplate } from 'src/types/TableColumnTemplate';
import EditResultColumnTemplateDialog from 'components/campManagement/table/dialogs/template/EditResultColumnTemplateDialog.vue';
import { Camp } from 'src/types/Camp';

interface Props {
  template: TableTemplate;
  camp: Camp;
}

const props = defineProps<Props>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { to } = useObjectTranslation();

const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const template = reactive<TableTemplate>(
  structuredClone(toRaw(props.template))
);

const sortByOptions = computed(() => {
  return template.columns.map((value) => {
    return {
      value: value.name,
      label: value.label,
    };
  });
});

const minWidth = computed<number>(() => {
  return quasar.screen.xs || quasar.screen.sm ? 500 : 1000;
});

function swapSortDirection(): void {
  template.sortDirection = template.sortDirection === 'asc' ? 'desc' : 'asc';
}

function addColumn(): void {
  const column: TableColumnTemplate = {
    name: 'column_' + template.columns.length,
    label: 'label ' + template.columns.length,
    field: '',
  };

  quasar
    .dialog({
      component: EditResultColumnTemplateDialog,
      componentProps: {
        column: column,
        camp: props.camp,
      },
    })
    .onOk((payload: TableColumnTemplate) => {
      template.columns.push(payload);
    });
}

function editColumn(column: TableColumnTemplate): void {
  quasar
    .dialog({
      component: EditResultColumnTemplateDialog,
      componentProps: {
        column: column,
        camp: props.camp,
      },
    })
    .onOk((payload: TableColumnTemplate) => {
      const index = template.columns.indexOf(column);
      template.columns.splice(index, 1, payload);
    });
}

function onOKClick(): void {
  onDialogOK(template);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Edit Template'

sections:
  columns: 'Columns'
  filter: 'Filters'
  sort: 'Sorting'

actions:
  ok: 'Ok'
  cancel: 'Cancel'

fields:
  title:
    label: 'Title'
    hint: ''
  indexed:
    label: 'Show index'
    hint: ''
  actions:
    label: 'Show actions'
    hint: ''
  sortBy:
    label: 'Sort by column'
    hint: ''
  filter:
    label: 'Filter row by'
    hint: 'Expression when to show a row'
  filter_participants:
    label: 'Filter normal registrations'
    hint: ''
  filter_waiting_list:
    label: 'Filter registrations on waiting list'
    hint: ''
  filter_leaders:
    label: 'Filter camp leader registrations'
    hint: ''
</i18n>

<i18n lang="yaml" locale="de">
title: 'Vorlage bearbeiten'

sections:
  columns: 'Spalten'
  filter: 'Filter'
  sort: 'Sortierung'

actions:
  ok: 'Ok'
  cancel: 'Abbrechen'

fields:
  title:
    label: 'Titel'
    hint: ''
  indexed:
    label: 'Index anzeigen'
    hint: ''
  actions:
    label: 'Aktionen anzeigen'
    hint: ''
  sortBy:
    label: 'Nach Spalte sortieren'
    hint: ''
  filter:
    label: 'Zeile filtern nach'
    hint: 'Ausdruck, wann eine Zeile angezeigt werden soll'
  filter_participants:
    label: 'Normale Anmeldungen filtern'
    hint: ''
  filter_waiting_list:
    label: 'Anmeldungen auf Warteliste filtern'
    hint: ''
  filter_leaders:
    label: 'Anmeldungen von Lagerleitern filtern'
    hint: ''
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier le modèle'

sections:
  columns: 'Colonnes'
  filter: 'Filtres'
  sort: 'Trier'

actions:
  ok: 'Ok'
  cancel: 'Annuler'

fields:
  title:
    label: 'Titre'
    hint: ''
  indexed:
    label: "Afficher l'index"
    hint: ''
  actions:
    label: 'Afficher les actions'
    hint: ''
  sortBy:
    label: 'Trier par colonne'
    hint: ''
  filter:
    label: 'Filtrer la ligne par'
    hint: 'Expression indiquant quand afficher une ligne'
  filter_participants:
    label: 'Filtrer les inscriptions normales'
    hint: ''
  filter_waiting_list:
    label: 'Filtrer les inscriptions en liste d’attente'
    hint: ''
  filter_leaders:
    label: 'Filtrer les inscriptions de chefs de camp'
    hint: ''
</i18n>
