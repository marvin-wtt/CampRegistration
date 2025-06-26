<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card
      class="q-dialog-plugin q-pb-none row justify-between content-start"
      :style="cardStyle"
    >
      <q-card-section class="col-12 text-h5">
        {{ t('title') }}
      </q-card-section>

      <q-card-section class="col-12 col-md-7 q-pt-none q-gutter-y-sm column">
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
          {{ t('sections.columns') }}
        </a>

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

      <div class="col-12 col-md-5">
        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <a class="text-h6">
            {{ t('sections.options') }}
          </a>

          <q-select
            v-model="template.sortBy"
            :label="t('fields.sortBy.label')"
            :hint="t('fields.sortBy.hint')"
            :options="sortByOptions"
            emit-value
            map-options
            hide-bottom-space
            outlined
            rounded
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.value }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <template #prepend>
              <q-icon name="sort" />
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

          <q-select
            v-model="template.filterWaitingList"
            :label="t('fields.filter_waiting_list.label')"
            :options="waitingListOptions"
            emit-value
            map-options
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="filter_alt" />
            </template>
          </q-select>

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
          >
            <template #prepend>
              <q-icon name="filter_alt" />
            </template>
          </q-select>

          <q-btn
            :label="advanced ? t('advanced.hide') : t('advanced.show')"
            :icon="advanced ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
            color="grey"
            flat
            dense
            rounded
            class="full-width"
            @click="advanced = !advanced"
          />

          <q-slide-transition>
            <div
              v-show="advanced"
              class="q-gutter-y-sm column no-wrap"
            >
              <a class="text-h6">
                {{ t('sections.advanced') }}
              </a>

              <q-toggle
                v-model="template.indexed"
                :label="t('fields.indexed.label')"
              />

              <q-toggle
                v-model="template.actions"
                :label="t('fields.actions.label')"
              />

              <q-input
                v-model="template.filter"
                :label="t('fields.filter.label')"
                :hint="t('fields.filter.hint')"
                clearable
                outlined
                rounded
              >
                <template #prepend>
                  <q-icon name="filter_alt" />
                </template>
              </q-input>
            </div>
          </q-slide-transition>
        </q-card-section>
      </div>

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
import {
  type QSelectOption,
  useDialogPluginComponent,
  useQuasar,
} from 'quasar';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import type {
  TableTemplate,
  TableColumnTemplate,
  Camp,
} from '@camp-registration/common/entities';
import TranslatedInput from 'components/common/inputs/TranslatedInput.vue';
import { computed, reactive, ref } from 'vue';
import SortableList from 'components/common/SortableList.vue';
import TableTemplateColumnEditDialog from 'components/campManagement/table/dialogs/template/TableTemplateColumnEditDialog.vue';
import type { PartialBy } from 'src/types';
import { uniqueName } from 'src/utils/uniqueName';
import { deepToRaw } from 'src/utils/deepToRaw';

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

const template = reactive<TableTemplate>(
  structuredClone(deepToRaw(props.template)),
);
const advanced = ref<boolean>(false);

const roleOptions: (string | QSelectOption)[] = ['participant', 'counselor'];
const roleFilteredOptions = ref<(string | QSelectOption)[]>(roleOptions);

const waitingListOptions: QSelectOption[] = [
  {
    value: 'include',
    label: t('fields.filter_waiting_list.options.include'),
  },
  {
    value: 'exclude',
    label: t('fields.filter_waiting_list.options.exclude'),
  },
  {
    value: 'only',
    label: t('fields.filter_waiting_list.options.only'),
  },
];

const sortByOptions = computed<QSelectOption[]>(() => {
  return template.columns.map((value) => {
    return {
      label: to(value.label),
      value: value.name,
    };
  });
});

const cardStyle = computed<CSSStyleValue>(() => {
  if (quasar.screen.gt.sm) {
    return {
      minWidth: '1000px',
    };
  }

  return {};
});

function swapSortDirection(): void {
  template.sortDirection = template.sortDirection === 'asc' ? 'desc' : 'asc';
}

function addColumn(): void {
  const column: PartialBy<TableColumnTemplate, 'name'> = {
    label: 'label ' + template.columns.length,
    source: 'form',
    field: '',
    align: 'left',
    renderAs: 'default',
  };

  quasar
    .dialog({
      component: TableTemplateColumnEditDialog,
      componentProps: {
        column: column,
        camp: props.camp,
      },
    })
    .onOk((payload: TableColumnTemplate) => {
      payload.name = payload.name ?? createColumnName(payload.label);

      template.columns.push(payload);
    });
}

function createColumnName(label: TableColumnTemplate['label']): string {
  const labelString =
    typeof label === 'string' ? label : (Object.values(label)[0] ?? '');
  const name = labelString.toLowerCase().replaceAll(' ', '_');
  const names = template.columns.map((column) => column.name);

  return uniqueName(name, names);
}

function editColumn(column: TableColumnTemplate): void {
  quasar
    .dialog({
      component: TableTemplateColumnEditDialog,
      componentProps: {
        column: {
          source: 'form', // Fallback value
          ...column,
        },
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

advanced:
  hide: 'Hide advanced options'
  show: 'Show advanced options'

sections:
  advanced: 'Advanced options'
  columns: 'Columns'
  options: 'Options'

actions:
  ok: 'Ok'
  cancel: 'Cancel'

fields:
  title:
    label: 'Title'
    hint: ''
  indexed:
    label: 'Number columns'
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
    label: 'Waiting list'
    hint: ''
    options:
      exclude: 'Exclude Waiting List'
      include: 'Show all registrations'
      only: 'Show Only Waiting List'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Vorlage bearbeiten'

advanced:
  hide: 'Erweiterte Optionen ausblenden'
  show: 'Erweiterte Optionen anzeigen'

sections:
  advanced: 'Erweiterte Optionen'
  columns: 'Spalten'
  options: 'Optionen'

actions:
  ok: 'Ok'
  cancel: 'Abbrechen'

fields:
  title:
    label: 'Titel'
    hint: ''
  indexed:
    label: 'Spalten nummerieren'
    hint: ''
  actions:
    label: 'Aktionen anzeigen'
    hint: ''
  sortBy:
    label: 'Nach Spalte sortieren'
    hint: ''
  filter:
    label: 'Zeile filtern nach'
    hint: 'Ausdruck, wann eine Zeile angezeigt wird'
  filter_roles:
    label: 'Registrierungen mit Rolle ausblenden'
    hint: ''
  filter_waiting_list:
    label: 'Warteliste'
    hint: ''
    options:
      exclude: 'Warteliste ausschließen'
      include: 'Alle Registrierungen anzeigen'
      only: 'Nur Warteliste anzeigen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier le modèle'

advanced:
  hide: 'Masquer les options avancées'
  show: 'Afficher les options avancées'

sections:
  advanced: 'Options avancées'
  columns: 'Colonnes'
  options: 'Options'

actions:
  ok: 'Ok'
  cancel: 'Annuler'

fields:
  title:
    label: 'Titre'
    hint: ''
  indexed:
    label: 'Numéroter les colonnes'
    hint: ''
  actions:
    label: 'Afficher les actions'
    hint: ''
  sortBy:
    label: 'Trier par colonne'
    hint: ''
  filter:
    label: 'Filtrer la ligne par'
    hint: 'Expression pour déterminer quand afficher une ligne'
  filter_roles:
    label: 'Masquer les inscriptions avec rôle'
    hint: ''
  filter_waiting_list:
    label: 'Liste d’attente'
    hint: ''
    options:
      exclude: 'Exclure la liste d’attente'
      include: 'Afficher toutes les inscriptions'
      only: 'Afficher uniquement la liste d’attente'
</i18n>
