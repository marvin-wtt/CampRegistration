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
          :label="t('field.title.label')"
          :locales="event.locales"
          hide-bottom-space
          outlined
          rounded
        />

        <a class="text-h6">
          {{ t('section.columns') }}
        </a>

        <sortable-list
          v-slot="slotProps"
          v-model="template.columns"
          addable
          editable
          deletable
          sortable
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
          </q-item-section>
        </sortable-list>
      </q-card-section>

      <div class="col-12 col-md-5">
        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <a class="text-h6">
            {{ t('section.options') }}
          </a>

          <q-select
            v-model="template.sortBy"
            :label="t('field.sortBy.label')"
            :hint="t('field.sortBy.hint')"
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
            v-model="template.filterStatus"
            :label="t('field.filter_status.label')"
            :options="statusOptions"
            emit-value
            map-options
            multiple
            use-chips
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="filter_alt" />
            </template>
          </q-select>

          <q-select
            v-model="template.filterRoles"
            :label="t('field.filter_roles.label')"
            emit-value
            map-options
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

          <q-select
            v-model="printOrientation"
            :label="t('field.print_orientation.label')"
            :hint="t('field.print_orientation.hint')"
            :options="orientationOptions"
            emit-value
            map-options
            hide-bottom-space
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="print" />
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
                {{ t('section.advanced') }}
              </a>

              <q-toggle
                v-model="template.indexed"
                :label="t('field.indexed.label')"
              />

              <q-toggle
                v-model="template.actions"
                :label="t('field.actions.label')"
              />

              <q-input
                v-model="template.filter"
                :label="t('field.filter.label')"
                :hint="t('field.filter.hint')"
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
          :label="t('action.cancel')"
          @click="onDialogCancel"
        />
        <q-btn
          rounded
          color="primary"
          :label="t('action.ok')"
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
import { useObjectTranslation } from '@/composables/objectTranslation';
import type {
  TableTemplate,
  TableColumnTemplate,
  Event,
  Registration,
} from '@camp-registration/common/entities';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import { computed, reactive, ref } from 'vue';
import SortableList from '@/components/common/SortableList.vue';
import TableTemplateColumnEditDialog from '@/components/event/table/dialogs/TableTemplateColumnEditDialog.vue';
import type { PartialBy } from '@/types';
import { uniqueName } from '@/utils/uniqueName';
import { deepToRaw } from '@/utils/deepToRaw';

interface Props {
  template: TableTemplate;
  event: Event;
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

type RegistrationRole = Registration['computedData']['role'];
const roleOptions: QSelectOption<RegistrationRole>[] = [
  {
    value: 'participant',
    label: t('field.filter_roles.option.participant'),
  },
  {
    value: 'counselor',
    label: t('field.filter_roles.option.counselor'),
  },
];
const roleFilteredOptions = ref<QSelectOption<RegistrationRole>[]>(roleOptions);

const statusOptions: QSelectOption<Registration['status']>[] = [
  {
    value: 'ACCEPTED',
    label: t('field.filter_status.option.accepted'),
  },
  {
    value: 'WAITLISTED',
    label: t('field.filter_status.option.waitlisted'),
  },
  {
    value: 'PENDING',
    label: t('field.filter_status.option.pending'),
  },
];

// Use 'auto' as placeholder for undefined - will be removed by setter
type PrintOrientation =
  | Exclude<
      Exclude<TableTemplate['printOptions'], undefined>['orientation'],
      undefined
    >
  | 'auto';
const orientationOptions: QSelectOption<PrintOrientation>[] = [
  {
    value: 'auto',
    label: t('field.print_orientation.option.auto'),
  },
  {
    value: 'portrait',
    label: t('field.print_orientation.option.portrait'),
  },
  {
    value: 'landscape',
    label: t('field.print_orientation.option.landscape'),
  },
];

// `auto` is the absence of the setting; the print page then derives the
// orientation from the table's intrinsic width.
const printOrientation = computed<PrintOrientation>({
  get: () => template.printOptions?.orientation ?? 'auto',
  set: (value) => {
    if (value === 'auto') {
      delete template.printOptions;
      return;
    }

    template.printOptions = { ...template.printOptions, orientation: value };
  },
});

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
        event: props.event,
      },
    })
    .onOk((payload: TableColumnTemplate) => {
      payload.name = payload.name || createColumnName(payload.label);

      template.columns.push(payload);
    });
}

function createColumnName(
  label: TableColumnTemplate['label'],
  exclude?: string,
): string {
  const labelString =
    typeof label === 'string' ? label : (Object.values(label)[0] ?? '');
  const name = labelString.toLowerCase().replaceAll(' ', '_');
  const names = template.columns
    .map((column) => column.name)
    .filter((columnName) => columnName !== exclude);

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
        event: props.event,
      },
    })
    .onOk((payload: TableColumnTemplate) => {
      payload.name =
        payload.name || createColumnName(payload.label, column.name);

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
    roleFilteredOptions.value = roleOptions.filter(
      (v) => v.label.toLowerCase().indexOf(value.toLowerCase()) > -1,
    );
  });
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Edit Table'

advanced:
  hide: 'Hide advanced options'
  show: 'Show advanced options'

section:
  advanced: 'Advanced options'
  columns: 'Columns'
  options: 'Options'

action:
  ok: 'Ok'
  cancel: 'Cancel'

field:
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
    option:
      participant: 'Participant'
      counselor: 'Counselor'
  filter_status:
    label: 'Status'
    hint: ''
    option:
      accepted: 'Accepted'
      pending: 'Pending'
      waitlisted: 'Waitlisted'
  print_orientation:
    label: 'Print orientation'
    hint: 'Page orientation when this table is printed'
    option:
      auto: 'Automatic'
      portrait: 'Portrait'
      landscape: 'Landscape'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Tabelle bearbeiten'

advanced:
  hide: 'Erweiterte Optionen ausblenden'
  show: 'Erweiterte Optionen anzeigen'

section:
  advanced: 'Erweiterte Optionen'
  columns: 'Spalten'
  options: 'Optionen'

action:
  ok: 'Ok'
  cancel: 'Abbrechen'

field:
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
    option:
      participant: 'Teilnehmer'
      counselor: 'Betreuer'
  filter_status:
    label: 'Status'
    hint: ''
    option:
      accepted: 'Akzeptiert'
      pending: 'Ausstehend'
      waitlisted: 'Auf der Warteliste'
  print_orientation:
    label: 'Druckausrichtung'
    hint: 'Seitenausrichtung beim Drucken dieser Tabelle'
    option:
      auto: 'Automatisch'
      portrait: 'Hochformat'
      landscape: 'Querformat'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier le tableau'

advanced:
  hide: 'Masquer les options avancées'
  show: 'Afficher les options avancées'

section:
  advanced: 'Options avancées'
  columns: 'Colonnes'
  options: 'Options'

action:
  ok: 'Ok'
  cancel: 'Annuler'

field:
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
    option:
      participant: 'Participant'
      counselor: 'Animateur'
  filter_status:
    label: 'Statut'
    hint: ''
    option:
      accepted: 'Accepté'
      pending: 'En attente'
      waitlisted: "Sur liste d'attente"
  print_orientation:
    label: "Orientation d'impression"
    hint: "Orientation de la page lors de l'impression de ce tableau"
    option:
      auto: 'Automatique'
      portrait: 'Portrait'
      landscape: 'Paysage'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Edytuj tabelę'

advanced:
  hide: 'Ukryj opcje zaawansowane'
  show: 'Pokaż opcje zaawansowane'

section:
  advanced: 'Opcje zaawansowane'
  columns: 'Kolumny'
  options: 'Opcje'

action:
  ok: 'OK'
  cancel: 'Anuluj'

field:
  title:
    label: 'Tytuł'
    hint: ''
  indexed:
    label: 'Numeruj kolumny'
    hint: ''
  actions:
    label: 'Pokaż akcje'
    hint: ''
  sortBy:
    label: 'Sortuj według kolumny'
    hint: ''
  filter:
    label: 'Filtruj wiersze według'
    hint: 'Wyrażenie określające, kiedy wiersz ma być wyświetlony'
  filter_roles:
    label: 'Ukryj rejestracje z rolą'
    hint: ''
    option:
      participant: 'Uczestnik'
      counselor: 'Opiekun'
  filter_status:
    label: 'Status'
    hint: ''
    option:
      accepted: 'Zaakceptowane'
      pending: 'Oczekujące'
      waitlisted: 'Na liście oczekujących'
  print_orientation:
    label: 'Orientacja wydruku'
    hint: 'Orientacja strony podczas drukowania tej tabeli'
    option:
      auto: 'Automatycznie'
      portrait: 'Pionowa'
      landscape: 'Pozioma'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Upravit tabulku'

advanced:
  hide: 'Skrýt pokročilé možnosti'
  show: 'Zobrazit pokročilé možnosti'

section:
  advanced: 'Pokročilé možnosti'
  columns: 'Sloupce'
  options: 'Možnosti'

action:
  ok: 'OK'
  cancel: 'Zrušit'

field:
  title:
    label: 'Název'
    hint: ''
  indexed:
    label: 'Číslovat sloupce'
    hint: ''
  actions:
    label: 'Zobrazit akce'
    hint: ''
  sortBy:
    label: 'Řadit podle sloupce'
    hint: ''
  filter:
    label: 'Filtrovat řádky podle'
    hint: 'Výraz určující, kdy se má řádek zobrazit'
  filter_roles:
    label: 'Skrýt registrace s rolí'
    hint: ''
    option:
      participant: 'Účastník'
      counselor: 'Vedoucí'
  filter_status:
    label: 'Stav'
    hint: ''
    option:
      accepted: 'Přijato'
      pending: 'Čeká na vyřízení'
      waitlisted: 'Na čekací listině'
  print_orientation:
    label: 'Orientace tisku'
    hint: 'Orientace stránky při tisku této tabulky'
    option:
      auto: 'Automaticky'
      portrait: 'Na výšku'
      landscape: 'Na šířku'
</i18n>
