<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">
          {{ t('title') }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none q-gutter-y-sm column">
        <q-input
          v-model="column.name"
          :label="t('fields.name.label')"
          :hint="t('fields.name.hint')"
          :rules="[
            (val: string) => !!val || t('fields.name.rules.required'),
            (val: string) =>
              !/\s/.test(val) || t('fields.name.rules.no_spaces'),
          ]"
          outlined
          rounded
        />

        <translated-input
          v-model="column.label"
          :label="t('fields.label.label')"
          :locales="props.camp.countries"
          outlined
          rounded
        />

        <q-select
          v-model="column.field"
          :label="t('fields.field.label')"
          :hint="t('fields.field.hint')"
          :options="fieldFilterOptions"
          emit-value
          use-input
          hide-bottom-space
          outlined
          rounded
          @new-value="createField"
          @filter="fieldFilterFn"
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
              v-if="column.field"
              name="close"
              class="cursor-pointer"
              @click.stop.prevent="column.field = ''"
            />
          </template>
        </q-select>

        <toggle-item
          v-if="showIsArray"
          v-model="column.isArray"
          :label="t('fields.isArray.label')"
          :hint="t('fields.isArray.hint')"
        />

        <q-select
          v-model="column.align"
          :label="t('fields.align.label')"
          :hint="t('fields.hideIf.hint')"
          :options="alignOptions"
          emit-value
          map-options
          outlined
          rounded
        />

        <q-select
          v-model="column.renderAs"
          :label="t('fields.renderAs.label')"
          :hint="t('fields.renderAs.hint')"
          :options="renderAsOptions"
          clearable
          emit-value
          map-options
          outlined
          rounded
        />

        <!-- render options -->
        <q-list
          v-if="column.renderAs"
          bordered
          class="rounded-borders"
        >
          <q-expansion-item
            :label="t('fields.renderOptions.label')"
            :caption="t('fields.renderOptions.hint')"
          >
            <dynamic-input-group
              v-if="renderOptions"
              v-model="column.renderOptions"
              :elements="renderOptions"
            />

            <json-input
              v-else
              v-model="column.renderOptions"
              filled
            />
          </q-expansion-item>
        </q-list>

        <!-- TODO Enable if feature is implemented or remove it -->
        <!-- -->
        <!--        <toggle-item-->
        <!--          v-model="column.editable"-->
        <!--          :label="t('fields.editable.label')"-->
        <!--          :hint="t('fields.editable.hint')"-->
        <!--        />-->

        <toggle-item
          v-model="column.sortable"
          :label="t('fields.sortable.label')"
          :hint="t('fields.sortable.hint')"
        />

        <toggle-item
          v-model="column.headerVertical"
          :label="t('fields.headerVertical.label')"
          :hint="t('fields.headerVertical.hint')"
        />

        <toggle-item
          v-model="column.shrink"
          :label="t('fields.shrink.label')"
          :hint="t('fields.shrink.hint')"
        />

        <q-input
          v-model="column.hideIf"
          :label="t('fields.hideIf.label')"
          :hint="t('fields.hideIf.hint')"
          clearable
          outlined
          rounded
        />

        <q-input
          v-model="column.showIf"
          :label="t('fields.showIf.label')"
          :hint="t('fields.showIf.hint')"
          clearable
          outlined
          rounded
        />
      </q-card-section>

      <!-- action buttons -->
      <q-card-actions align="right">
        <q-btn
          color="primary"
          :label="t('actions.cancel')"
          outline
          rounded
          @click="onDialogCancel"
        />
        <q-btn
          color="primary"
          :label="t('actions.ok')"
          rounded
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { QSelectOption, useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, reactive, ref, toRaw } from 'vue';
import type {
  CampDetails,
  TableColumnTemplate,
  Registration,
} from '@camp-registration/common/entities';
import TranslatedInput from 'components/common/inputs/TranslatedInput.vue';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import JsonInput from 'components/common/inputs/JsonInput.vue';
import ComponentRegistry from 'components/campManagement/table/ComponentRegistry';
import ToggleItem from 'components/common/ToggleItem.vue';
import { extractFormFields } from 'src/utils/surveyJS';
import { BaseComponent } from 'components/common/inputs/BaseComponent';
import DynamicInputGroup from 'components/common/inputs/DynamicInputGroup.vue';

interface Props {
  column: TableColumnTemplate;
  camp: CampDetails;
}

const props = defineProps<Props>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { to } = useObjectTranslation();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const column = reactive<TableColumnTemplate>(
  structuredClone(toRaw(props.column)),
);

function onOKClick(): void {
  onDialogOK(column);
}

const showIsArray = computed<boolean>(() => {
  return column.isArray || column.field?.includes('.*.');
});

const alignOptions = computed(() => {
  return [
    {
      label: t('fields.align.options.left'),
      value: 'left',
    },
    {
      label: t('fields.align.options.right'),
      value: 'right',
    },
    {
      label: t('fields.align.options.center'),
      value: 'center',
    },
  ];
});

const renderOptions = computed<BaseComponent[] | undefined>(() => {
  if (!column.renderAs) {
    return undefined;
  }

  const renderer = ComponentRegistry.get(column.renderAs);

  return renderer?.options.customOptions;
});

const renderAsOptions = computed<QSelectOption[]>(() => {
  return Array.from(ComponentRegistry.all().entries(), ([key, value]) => {
    const options = value.options;
    if (options.internal) {
      return undefined;
    }

    return {
      label: to(options.label) || key,
      value: key,
    };
  })
    .filter((value): value is QSelectOption => !!value)
    .sort((a, b) => a?.label.localeCompare(b?.label));
});

const fieldOptions = computed(() => {
  const formFields = extractFormFields(props.camp.form, 'data');

  const defaultFields: { label: string; value: keyof Registration }[] = [
    {
      label: t('fields.field.options.createdAt'),
      value: 'createdAt',
    },
    {
      label: t('fields.field.options.waitingList'),
      value: 'waitingList',
    },
    {
      label: t('fields.field.options.room'),
      value: 'room',
    },
  ];
  formFields.push(...defaultFields);

  return formFields;
});

const fieldFilterOptions = ref(fieldOptions.value);

function createField(val: string, done: (val: string) => void) {
  val = val.trim();
  if (val.length === 0 && /\s/g.test(val)) {
    return;
  }
  done(val);
}

function fieldFilterFn(val: string, update: (a: () => void) => void) {
  update(() => {
    if (val === '') {
      fieldFilterOptions.value = fieldOptions.value;
    } else {
      const needle = val.toLowerCase();
      fieldFilterOptions.value = fieldOptions.value.filter(
        (v) => v.value.toLowerCase().indexOf(needle) > -1,
      );
    }
  });
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Edit Template Column'

actions:
  ok: 'Ok'
  cancel: 'Cancel'

fields:
  name:
    label: 'Name'
    hint: 'A unique name to identify the column (some_name)'
    rules:
      required: 'Name must not be empty'
      no_spaces: 'Use underscores instead of spaces'
  label:
    label: 'Label'
    hint: ''
  field:
    label: 'Field'
    hint: 'Name of corresponding form field'
    options:
      createdAt: 'Creation date'
      room: 'Room'
      waitingList: 'Waiting list'
  isArray:
    label: 'Multiple values'
    hint: 'Values are split into multiple sub-rows'
  align:
    label: 'Align'
    hint: 'Direction to align content of cell'
    options:
      left: 'Left'
      right: 'Right'
      center: 'Center'
  renderAs:
    label: 'Render As'
    hint: 'Name of a custom display type'
  renderOptions:
    label: 'Custom options for the renderer'
    hint: 'The content should be valid JSON'
  editable:
    label: 'Editable'
    hint: 'Allow edit in table cell'
  sortable:
    label: 'Sortable'
    hint: ''
  headerVertical:
    label: 'Vertical Header'
    hint: ''
  shrink:
    label: 'Shrink column size'
    hint: ''
  hideIf:
    label: 'Hide if'
    hint: 'Expression when not to show the cell'
  showIf:
    label: 'Show if'
    hint: 'Expression when to show the cell'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Template-Spalte bearbeiten'
actions:
  ok: 'Ok'
  cancel: 'Abbrechen'
fields:
  name:
    label: 'Name'
    hint: 'Ein eindeutiger Name zur Identifizierung (some_name)'
    rules:
      required: 'Name darf nicht leer sein'
      no_spaces: 'Unterstriche statt Leerzeichen verwenden'
  label:
    label: 'Label'
    hint: ''
  field:
    label: 'Feld'
    hint: 'Name des entsprechenden Formularfelds'
    options:
      createdAt: 'Erstellungsdatum'
      room: 'Raum'
      waitingList: 'Warteliste'
  isArray:
    label: 'Mehrere Werte'
    hint: 'Werte sind in mehrere Unterzeilen aufgeteilt'
  align:
    label: 'Ausrichtung'
    hint: 'Richtung zur Ausrichtung des Zellinhalts'
    options:
      left: 'Links'
      right: 'Rechts'
      center: 'Mitte'
  renderAs:
    label: 'Darstellen als'
    hint: 'Name eines benutzerdefinierten Anzeigetyps'
  editable:
    label: 'Bearbeitbar'
    hint: 'Bearbeitung in Tabellenzelle zulassen'
  renderOptions:
    label: 'Benutzerdefinierte Optionen für den Renderer'
    hint: 'Der Inhalt sollte gültiges JSON sein'
  sortable:
    label: 'Sortierbar'
    hint: ''
  headerVertical:
    label: 'Vertikale Kopfzeile'
    hint: ''
  shrink:
    label: 'Spalte verkleinern'
    hint: ''
  hideIf:
    label: 'Verbergen wenn'
    hint: 'Ausdruck, wenn die Zelle nicht angezeigt werden soll'
  showIf:
    label: 'Anzeigen wenn'
    hint: 'Ausdruck, wenn die Zelle angezeigt werden soll'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier la colonne de modèle'
actions:
  ok: 'Ok'
  cancel: 'Annuler'
fields:
  name:
    label: 'Nom'
    hint: 'Un nom unique pour identifier la colonne (some_name)'
    rules:
      required: 'Le nom ne doit pas être vide'
      no_spaces: "Utiliser des traits de soulignement au lieu d'espaces"
  label:
    label: 'Libellé'
    hint: ''
  field:
    label: 'Champ'
    hint: 'Nom du champ de formulaire correspondant'
    options:
      createdAt: 'Date de création'
      room: 'Salle'
      waitingList: "Liste d'attente"
  isArray:
    label: 'Valeurs multiples'
    hint: 'Les valeurs sont réparties dans plusieurs sous-lignes'
  align:
    label: 'Orientation'
    hint: 'Direction pour aligner le contenu de la cellule'
    options:
      left: 'Gauche'
      right: 'Droite'
      center: 'Centre'
  renderAs:
    label: 'Rendre comme'
    hint: "Nom d'un type d'affichage personnalisé"
  renderOptions:
    label: 'Options personnalisées pour le moteur de rendu'
    hint: 'Le contenu doit être du JSON valide'
  editable:
    label: 'Editable'
    hint: "Permettre l'édition dans une cellule de tableau"
  sortable:
    label: 'Triable'
    hint: ''
  headerVertical:
    label: 'En-tête vertical'
    hint: ''
  shrink:
    label: 'Réduire la taille de la colonne'
    hint: ''
  hideIf:
    label: 'Masquer si'
    hint: "Expression lorsqu'il ne faut pas afficher la cellule"
  showIf:
    label: 'Afficher si'
    hint: "Expression lorsqu'il faut"
</i18n>
