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

        <q-select
          v-model="template.filterWaitingList"
          :label="t('fields.filter_waiting_list.label')"
          :options="waitingListOptions"
          emit-value
          map-options
          outlined
          rounded
        />

        <q-select
          v-model="template.filterRoles"
          :label="t('fields.filter_roles.label')"
          use-input
          use-chips
          outlined
          rounded
          multiple
          input-debounce="0"
          new-value-mode="add-unique"
          :options="roleFilteredOptions"
          @new-value="createRoleFilter"
          @filter="roleFilterFn"
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
import { QSelectOption, useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import type {
  TableTemplate,
  TableColumnTemplate,
  Camp,
} from '@camp-registration/common/entities';
import TranslatedInput from 'components/common/inputs/TranslatedInput.vue';
import { computed, reactive, ref, toRaw } from 'vue';
import SortableList from 'components/common/SortableList.vue';
import EditResultColumnTemplateDialog from 'components/campManagement/table/dialogs/template/EditResultColumnTemplateDialog.vue';

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
  structuredClone(toRaw(props.template)),
);

const roleOptions: (string | QSelectOption)[] = ['participant', 'counselor'];
const roleFilteredOptions = ref<(string | QSelectOption)[]>(roleOptions);

const waitingListOptions: QSelectOption[] = [
  {
    value: 'exclude',
    label: t('fields.filter_waiting_list.options.exclude'),
  },
  {
    value: 'include',
    label: t('fields.filter_waiting_list.options.include'),
  },
  {
    value: 'only',
    label: t('fields.filter_waiting_list.options.only'),
  },
];

const sortByOptions = computed(() => {
  return template.columns.map((value) => {
    return {
      label: value.label,
      value: value.name,
    } as QSelectOption;
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
    renderAs: 'default',
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

function createRoleFilter(value: string, done: (val: string) => void) {
  done(value);
}

function roleFilterFn(value: string, update: (fn: () => void) => void) {
  update(() => {
    if (value === '') {
      roleFilteredOptions.value = roleOptions;
      return;
    }
    const needle = value.toLowerCase();
    roleFilteredOptions.value = roleOptions.filter((v) => {
      const roleName = typeof v === 'string' ? v : v.label;
      return roleName.toLowerCase().indexOf(needle) > -1;
    });
  });
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
  filter_roles:
    label: 'Hide registrations with role'
    hint: ''
  filter_waiting_list:
    label: 'Hide registrations on waiting list'
    hint: ''
    options:
      exclude: 'Exclude Waiting List'
      include: 'Show all'
      only: 'Only Waiting List'
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
  filter_roles:
    label: 'Anmeldungen mit Rolle ausblenden'
    hint: ''
  filter_waiting_list:
    label: 'Anmeldungen auf Warteliste ausblenden'
    hint: ''
    options:
      exclude: 'Warteliste ausschließen'
      include: 'Alle anzeigen'
      only: 'Nur Warteliste'
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
  filter_roles:
    label: 'Masquer les inscriptions avec rôle'
    hint: ''
  filter_waiting_list:
    label: 'Masquer les inscriptions en liste d’attente'
    hint: ''
  options:
    exclude: "Exclure la liste d'attente"
    include: 'Tout afficher'
    only: "Uniquement la liste d'attente"
</i18n>
