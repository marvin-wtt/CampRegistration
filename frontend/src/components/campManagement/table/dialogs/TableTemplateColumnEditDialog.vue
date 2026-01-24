<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="text-h6">
        {{ t('title') }}
      </q-card-section>

      <q-card-section class="q-pt-none q-gutter-y-sm column">
        <translated-input
          v-model="column.label"
          :label="t('field.label.label')"
          :locales="camp.locales"
          outlined
          rounded
        />

        <q-select
          v-model="column.source"
          :label="t('field.source.label')"
          :options="sourceOptions"
          map-options
          emit-value
          outlined
          rounded
        />

        <q-select
          v-if="!column.source || column.source === 'form'"
          v-model="column.field"
          :label="t('field.field.label')"
          :hint="t('field.field.hint')"
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

        <q-input
          v-else
          v-model="column.field"
          :label="t('field.field.label')"
          outlined
          rounded
        />

        <q-select
          v-if="column.source !== 'custom'"
          v-model="column.renderAs"
          :label="t('field.renderAs.label')"
          :hint="t('field.renderAs.hint')"
          :options="renderAsOptions"
          clearable
          emit-value
          map-options
          outlined
          rounded
        />

        <q-select
          v-model="column.align"
          :label="t('field.align.label')"
          :hint="t('field.hideIf.hint')"
          :options="alignOptions"
          emit-value
          map-options
          outlined
          rounded
        />

        <toggle-item
          v-model="column.sortable"
          :label="t('field.sortable.label')"
          :hint="t('field.sortable.hint')"
        />

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

        <!-- Advanced options -->
        <q-slide-transition>
          <div
            v-show="advanced"
            class="q-gutter-y-sm column no-wrap"
          >
            <toggle-item
              v-if="showIsArray"
              v-model="column.isArray"
              :label="t('field.isArray.label')"
              :hint="t('field.isArray.hint')"
            />

            <toggle-item
              v-model="column.headerVertical"
              :label="t('field.headerVertical.label')"
              :hint="t('field.headerVertical.hint')"
            />

            <toggle-item
              v-model="column.shrink"
              :label="t('field.shrink.label')"
              :hint="t('field.shrink.hint')"
            />

            <q-input
              v-model="column.name"
              :label="t('field.name.label')"
              :hint="t('field.name.hint')"
              :rules="[
                (val: string) => !!val || t('field.name.rules.required'),
                (val: string) =>
                  !/\s/.test(val) || t('field.name.rules.no_spaces'),
              ]"
              outlined
              rounded
            />

            <q-input
              v-model="column.hideIf"
              :label="t('field.hideIf.label')"
              :hint="t('field.hideIf.hint')"
              clearable
              outlined
              rounded
            />

            <q-input
              v-model="column.showIf"
              :label="t('field.showIf.label')"
              :hint="t('field.showIf.hint')"
              clearable
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
                :label="t('field.renderOptions.label')"
                :caption="t('field.renderOptions.hint')"
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
          </div>
        </q-slide-transition>
      </q-card-section>

      <!-- action buttons -->
      <q-card-actions align="right">
        <q-btn
          color="primary"
          :label="t('action.cancel')"
          outline
          rounded
          @click="onDialogCancel"
        />
        <q-btn
          color="primary"
          :label="t('action.ok')"
          rounded
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { type QSelectOption, useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, reactive, ref, watch, watchEffect } from 'vue';
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
import type { BaseComponent } from 'components/common/inputs/BaseComponent';
import DynamicInputGroup from 'components/common/inputs/DynamicInputGroup.vue';
import type { PartialBy } from 'src/types';
import { deepToRaw } from 'src/utils/deepToRaw';

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

const column = reactive<PartialBy<TableColumnTemplate, 'name'>>(
  structuredClone(deepToRaw(props.column)),
);
const advanced = ref<boolean>(false);

const showIsArray = computed<boolean>(() => {
  return column.isArray || column.field?.includes('.*');
});

watchEffect(() => {
  column.isArray = column.field?.includes('.*');
});

watch(
  () => column.source,
  (source) => {
    column.field = '';
    column.renderAs = source === 'custom' ? 'editor' : 'default';
  },
);

const alignOptions = computed<QSelectOption[]>(() => {
  return [
    {
      label: t('field.align.options.left'),
      value: 'left',
    },
    {
      label: t('field.align.options.center'),
      value: 'center',
    },
    {
      label: t('field.align.options.right'),
      value: 'right',
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

const sourceOptions = computed<QSelectOption[]>(() => {
  return [
    {
      label: t('field.source.options.form'),
      value: 'form',
    },
    {
      label: t('field.source.options.custom'),
      value: 'custom',
    },
  ];
});

const fieldOptions = computed<QSelectOption[]>(() => {
  const formFields = extractFormFields(props.camp.form, 'data');

  const defaultFields: { label: string; value: keyof Registration }[] = [
    {
      label: t('field.field.options.createdAt'),
      value: 'createdAt',
    },
    {
      label: t('field.field.options.waitingList'),
      value: 'waitingList',
    },
    {
      label: t('field.field.options.room'),
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

function onOKClick(): void {
  if (
    column.source === 'custom' &&
    column.field.length > 0 &&
    !column.field.startsWith('customData.')
  ) {
    column.field = `customData.${column.field}`;
  }

  onDialogOK(column);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Edit Template Column'

action:
  ok: 'Ok'
  cancel: 'Cancel'

advanced:
  hide: 'Hide advanced options'
  show: 'Show advanced options'

field:
  name:
    label: 'Name'
    hint: 'A unique name to identify the column (some_name)'
    rules:
      required: 'Name must not be empty'
      no_spaces: 'Use underscores instead of spaces'
  label:
    label: 'Label'
    hint: ''
  source:
    label: 'Field Source'
    options:
      form: 'Registration Form'
      custom: 'Custom'
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

action:
  ok: 'Ok'
  cancel: 'Abbrechen'

advanced:
  hide: 'Erweiterte Optionen ausblenden'
  show: 'Erweiterte Optionen anzeigen'

field:
  name:
    label: 'Name'
    hint: 'Ein eindeutiger Name zur Identifizierung (some_name)'
    rules:
      required: 'Name darf nicht leer sein'
      no_spaces: 'Unterstriche statt Leerzeichen verwenden'
  label:
    label: 'Label'
    hint: ''
  source:
    label: 'Quelle des Felds'
    options:
      form: 'Anmeldeformular'
      custom: 'Benutzerdefiniert'
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

action:
  ok: 'Ok'
  cancel: 'Annuler'

advanced:
  hide: 'Masquer les options avancées'
  show: 'Afficher les options avancées'

field:
  name:
    label: 'Nom'
    hint: 'Un nom unique pour identifier la colonne (some_name)'
    rules:
      required: 'Le nom ne doit pas être vide'
      no_spaces: "Utiliser des traits de soulignement au lieu d'espaces"
  label:
    label: 'Libellé'
    hint: ''
  source:
    label: 'Source du champ'
    options:
      form: "Formulaire d'inscription"
      custom: 'Personnalisé'
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

<i18n lang="yaml" locale="pl">
title: 'Edytuj kolumnę szablonu'

action:
  ok: 'OK'
  cancel: 'Anuluj'

advanced:
  hide: 'Ukryj zaawansowane opcje'
  show: 'Pokaż zaawansowane opcje'

field:
  name:
    label: 'Nazwa'
    hint: 'Unikalna nazwa identyfikacyjna (np. some_name)'
    rules:
      required: 'Nazwa nie może być pusta'
      no_spaces: 'Użyj podkreśleń zamiast spacji'
  label:
    label: 'Etykieta'
    hint: ''
  source:
    label: 'Źródło pola'
    options:
      form: 'Formularz rejestracyjny'
      custom: 'Niestandardowe'
  field:
    label: 'Pole'
    hint: 'Nazwa odpowiedniego pola formularza'
    options:
      createdAt: 'Data utworzenia'
      room: 'Pokój'
      waitingList: 'Lista oczekujących'
  isArray:
    label: 'Wiele wartości'
    hint: 'Wartości są podzielone na kilka wierszy'
  align:
    label: 'Wyrównanie'
    hint: 'Kierunek wyrównania zawartości komórki'
    options:
      left: 'Lewo'
      right: 'Prawo'
      center: 'Środek'
  renderAs:
    label: 'Wyświetl jako'
    hint: 'Nazwa niestandardowego typu wyświetlania'
  renderOptions:
    label: 'Niestandardowe opcje renderowania'
    hint: 'Zawartość powinna być prawidłowym JSON-em'
  sortable:
    label: 'Sortowalne'
    hint: ''
  headerVertical:
    label: 'Pionowy nagłówek'
    hint: ''
  shrink:
    label: 'Zwiń kolumnę'
    hint: ''
  hideIf:
    label: 'Ukryj, jeśli'
    hint: 'Wyrażenie określające, kiedy komórka ma być ukryta'
  showIf:
    label: 'Pokaż, jeśli'
    hint: 'Wyrażenie określające, kiedy komórka ma być pokazana'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Upravit sloupec šablony'

action:
  ok: 'OK'
  cancel: 'Zrušit'

advanced:
  hide: 'Skrýt pokročilé možnosti'
  show: 'Zobrazit pokročilé možnosti'

field:
  name:
    label: 'Název'
    hint: 'Jedinečný název pro identifikaci (např. some_name)'
    rules:
      required: 'Název nesmí být prázdný'
      no_spaces: 'Použijte podtržítka místo mezer'
  label:
    label: 'Popisek'
    hint: ''
  source:
    label: 'Zdroj pole'
    options:
      form: 'Registrační formulář'
      custom: 'Vlastní'
  field:
    label: 'Pole'
    hint: 'Název odpovídajícího pole ve formuláři'
    options:
      createdAt: 'Datum vytvoření'
      room: 'Pokoj'
      waitingList: 'Čekací seznam'
  isArray:
    label: 'Více hodnot'
    hint: 'Hodnoty jsou rozděleny do více řádků'
  align:
    label: 'Zarovnání'
    hint: 'Směr zarovnání obsahu buňky'
    options:
      left: 'Vlevo'
      right: 'Vpravo'
      center: 'Na střed'
  renderAs:
    label: 'Zobrazit jako'
    hint: 'Název vlastního typu zobrazení'
  renderOptions:
    label: 'Vlastní možnosti zobrazení'
    hint: 'Obsah musí být platný JSON'
  sortable:
    label: 'Tříditelné'
    hint: ''
  headerVertical:
    label: 'Vertikální záhlaví'
    hint: ''
  shrink:
    label: 'Zúžit sloupec'
    hint: ''
  hideIf:
    label: 'Skrýt, pokud'
    hint: 'Výraz určující, kdy se buňka nemá zobrazit'
  showIf:
    label: 'Zobrazit, pokud'
    hint: 'Výraz určující, kdy se buňka má zobrazit'
</i18n>
