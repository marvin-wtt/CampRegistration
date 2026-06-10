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
          v-model="data.label"
          :label="t('field.label.label')"
          :locales="camp.locales"
          outlined
          rounded
        />

        <q-select
          v-model="data.source"
          :label="t('field.source.label')"
          :options="sourceOptions"
          map-options
          emit-value
          outlined
          rounded
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
                <q-item-label caption>{{ scope.opt.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <q-select
          v-if="!data.source || data.source === 'form'"
          v-model="data.field"
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
              v-if="data.field"
              name="close"
              class="cursor-pointer"
              @click.stop.prevent="data.field = ''"
            />
          </template>
        </q-select>

        <q-select
          v-else-if="data.source === 'computed' || data.source === 'meta'"
          v-model="data.field"
          :label="t('field.field.label')"
          :options="fieldOptions"
          emit-value
          map-options
          clearable
          outlined
          rounded
        />

        <q-input
          v-else
          v-model="data.field"
          :label="t('field.field.label')"
          outlined
          rounded
        />

        <q-select
          v-if="data.source !== 'custom'"
          v-model="data.renderAs"
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
          v-model="data.align"
          :label="t('field.align.label')"
          :hint="t('field.hideIf.hint')"
          :options="alignOptions"
          emit-value
          map-options
          outlined
          rounded
        />

        <toggle-item
          v-model="data.sortable"
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
              v-model="data.isArray"
              :label="t('field.isArray.label')"
              :hint="t('field.isArray.hint')"
            />

            <toggle-item
              v-model="data.headerVertical"
              :label="t('field.headerVertical.label')"
              :hint="t('field.headerVertical.hint')"
            />

            <toggle-item
              v-model="data.shrink"
              :label="t('field.shrink.label')"
              :hint="t('field.shrink.hint')"
            />

            <q-input
              v-model="data.name"
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
              v-model="data.hideIf"
              :label="t('field.hideIf.label')"
              :hint="t('field.hideIf.hint')"
              clearable
              outlined
              rounded
            />

            <q-input
              v-model="data.showIf"
              :label="t('field.showIf.label')"
              :hint="t('field.showIf.hint')"
              clearable
              outlined
              rounded
            />

            <!-- render options -->
            <q-list
              v-if="data.renderAs"
              bordered
              class="rounded-borders"
            >
              <q-expansion-item
                :label="t('field.renderOptions.label')"
                :caption="t('field.renderOptions.hint')"
              >
                <dynamic-input-group
                  v-if="renderOptions"
                  v-model="data.renderOptions"
                  :elements="renderOptions"
                />

                <json-input
                  v-else
                  v-model="data.renderOptions"
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

const { camp, column } = defineProps<{
  column: TableColumnTemplate;
  camp: CampDetails;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { to } = useObjectTranslation();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

type PrefixedSource = Exclude<
  TableColumnTemplate['source'],
  'meta' | undefined
>;

const FIELD_MAP: Record<PrefixedSource, string> = {
  form: 'data',
  computed: 'computedData',
  custom: 'customData',
} as const;

const data = reactive<PartialBy<TableColumnTemplate, 'name'>>({
  ...structuredClone(deepToRaw(column)),
  source: getFieldSource(),
  field: removeFieldPrefix(),
});

function getFieldSource(): TableColumnTemplate['source'] {
  const entry = (Object.entries(FIELD_MAP) as [PrefixedSource, string][]).find(
    ([, prefix]) => column.field.startsWith(`${prefix}.`),
  );
  return entry?.[0] ?? column.source;
}

function removeFieldPrefix(): string {
  const prefix = Object.values(FIELD_MAP).find((p) =>
    column.field.startsWith(`${p}.`),
  );
  return prefix ? column.field.slice(`${prefix}.`.length) : column.field;
}

const advanced = ref<boolean>(false);

const showIsArray = computed<boolean>(() => {
  return data.isArray || data.field.includes('.*');
});

watchEffect(() => {
  data.isArray = data.field.includes('.*');
});

watch(
  () => data.source,
  (source) => {
    data.field = '';
    data.renderAs = source === 'custom' ? 'editor' : 'default';
    fieldFilterOptions.value = fieldOptions.value;
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
  if (!data.renderAs) {
    return undefined;
  }

  const renderer = ComponentRegistry.get(data.renderAs);

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
      label: t('field.source.options.form.label'),
      description: t('field.source.options.form.description'),
      value: 'form',
    },
    {
      label: t('field.source.options.computed.label'),
      description: t('field.source.options.computed.description'),
      value: 'computed',
    },
    {
      label: t('field.source.options.meta.label'),
      description: t('field.source.options.meta.description'),
      value: 'meta',
    },
    {
      label: t('field.source.options.custom.label'),
      description: t('field.source.options.custom.description'),
      value: 'custom',
    },
  ];
});

const fieldOptions = computed<QSelectOption[]>(() => {
  if (data.source === 'computed') {
    return [
      { label: t('field.field.computed.firstName'), value: 'firstName' },
      { label: t('field.field.computed.lastName'), value: 'lastName' },
      { label: t('field.field.computed.dateOfBirth'), value: 'dateOfBirth' },
      { label: t('field.field.computed.emails'), value: 'emails.*' },
      { label: t('field.field.computed.role'), value: 'role' },
      { label: t('field.field.computed.gender'), value: 'gender' },
      { label: t('field.field.computed.address'), value: 'address' },
      {
        label: t('field.field.computed.addressStreet'),
        value: 'address.street',
      },
      { label: t('field.field.computed.addressCity'), value: 'address.city' },
      {
        label: t('field.field.computed.addressZipCode'),
        value: 'address.zipCode',
      },
      {
        label: t('field.field.computed.addressCountry'),
        value: 'address.country',
      },
    ].sort((a, b) => a.label.localeCompare(b.label));
  }

  if (data.source === 'meta') {
    return [
      { label: t('field.field.options.status'), value: 'status' },
      { label: t('field.field.options.room'), value: 'room' },
      { label: t('field.field.options.createdAt'), value: 'createdAt' },
    ].sort((a, b) => a.label.localeCompare(b.label));
  }

  return extractFormFields(camp.form);
});

const fieldFilterOptions = ref(fieldOptions.value);

function createField(val: string, done: (val: string) => void) {
  val = val.trim();
  if (!val) {
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
        (v) =>
          v.value.toLowerCase().includes(needle) ||
          String(v.label).toLowerCase().includes(needle),
      );
    }
  });
}

function updateFieldPath() {
  if (!data.source || data.source === 'meta') return;
  const prefix = FIELD_MAP[data.source];
  if (prefix && data.field.length > 0 && !data.field.startsWith(`${prefix}.`)) {
    data.field = `${prefix}.${data.field}`;
  }
}

function onOKClick(): void {
  updateFieldPath();

  onDialogOK(data);
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
    label: 'Source'
    options:
      form:
        label: 'Registration Form'
        description: 'Field from the registration form'
      computed:
        label: 'Extracted Data'
        description: 'Auto-recognized data, e.g. name or email'
      meta:
        label: 'Registration Info'
        description: 'General registration fields, e.g. status or room'
      custom:
        label: 'Custom Field'
        description: 'Manually entered by staff, e.g. notes'
  field:
    label: 'Field'
    hint: 'Name of corresponding form field'
    options:
      createdAt: 'Creation date'
      room: 'Room'
      status: 'Status'
    computed:
      address: 'Address'
      addressCity: 'City'
      addressCountry: 'Country'
      addressStreet: 'Street'
      addressZipCode: 'Zip Code'
      dateOfBirth: 'Date of Birth'
      emails: 'Email'
      firstName: 'First Name'
      gender: 'Gender'
      lastName: 'Last Name'
      role: 'Role'
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
    label: 'Quelle'
    options:
      form:
        label: 'Anmeldeformular'
        description: 'Feld aus dem Anmeldeformular'
      computed:
        label: 'Erkannte Daten'
        description: 'Automatisch erkannte Daten, z. B. Name oder E-Mail'
      meta:
        label: 'Anmeldungsinfos'
        description: 'Allgemeine Felder, z. B. Status oder Raum'
      custom:
        label: 'Benutzerdefiniertes Feld'
        description: 'Manuell vom Team eingetragen, z. B. Notizen'
  field:
    label: 'Feld'
    hint: 'Name des entsprechenden Formularfelds'
    options:
      createdAt: 'Erstellungsdatum'
      room: 'Raum'
      status: 'Status'
    computed:
      address: 'Adresse'
      addressCity: 'Stadt'
      addressCountry: 'Land'
      addressStreet: 'Straße'
      addressZipCode: 'PLZ'
      dateOfBirth: 'Geburtsdatum'
      emails: 'E-Mail'
      firstName: 'Vorname'
      gender: 'Geschlecht'
      lastName: 'Nachname'
      role: 'Rolle'
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
    label: 'Source'
    options:
      form:
        label: "Formulaire d'inscription"
        description: "Champ du formulaire d'inscription"
      computed:
        label: 'Données extraites'
        description: 'Données auto-reconnues, ex. nom ou e-mail'
      meta:
        label: 'Infos inscription'
        description: 'Champs généraux, ex. statut ou chambre'
      custom:
        label: 'Champ personnalisé'
        description: "Saisi manuellement par l'équipe, ex. notes"
  field:
    label: 'Champ'
    hint: 'Nom du champ de formulaire correspondant'
    options:
      createdAt: 'Date de création'
      room: 'Salle'
      status: 'Statut'
    computed:
      address: 'Adresse'
      addressCity: 'Ville'
      addressCountry: 'Pays'
      addressStreet: 'Rue'
      addressZipCode: 'Code postal'
      dateOfBirth: 'Date de naissance'
      emails: 'E-mail'
      firstName: 'Prénom'
      gender: 'Genre'
      lastName: 'Nom de famille'
      role: 'Rôle'
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
    label: 'Źródło'
    options:
      form:
        label: 'Formularz rejestracyjny'
        description: 'Pole z formularza rejestracyjnego'
      computed:
        label: 'Rozpoznane dane'
        description: 'Automatycznie rozpoznane dane, np. imię lub e-mail'
      meta:
        label: 'Dane rejestracji'
        description: 'Ogólne pola, np. status lub pokój'
      custom:
        label: 'Niestandardowe pole'
        description: 'Ręcznie wprowadzone przez personel, np. notatki'
  field:
    label: 'Pole'
    hint: 'Nazwa odpowiedniego pola formularza'
    options:
      createdAt: 'Data utworzenia'
      room: 'Pokój'
      status: 'Status'
    computed:
      address: 'Adres'
      addressCity: 'Miasto'
      addressCountry: 'Kraj'
      addressStreet: 'Ulica'
      addressZipCode: 'Kod pocztowy'
      dateOfBirth: 'Data urodzenia'
      emails: 'E-mail'
      firstName: 'Imię'
      gender: 'Płeć'
      lastName: 'Nazwisko'
      role: 'Rola'
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
    label: 'Zdroj'
    options:
      form:
        label: 'Registrační formulář'
        description: 'Pole z registračního formuláře'
      computed:
        label: 'Rozpoznaná data'
        description: 'Automaticky rozpoznaná data, např. jméno nebo e-mail'
      meta:
        label: 'Informace o registraci'
        description: 'Obecná pole, např. stav nebo pokoj'
      custom:
        label: 'Vlastní pole'
        description: 'Ručně zadaná týmem, např. poznámky'
  field:
    label: 'Pole'
    hint: 'Název odpovídajícího pole ve formuláři'
    options:
      createdAt: 'Datum vytvoření'
      room: 'Pokoj'
      status: 'Stav'
    computed:
      address: 'Adresa'
      addressCity: 'Město'
      addressCountry: 'Země'
      addressStreet: 'Ulice'
      addressZipCode: 'PSČ'
      dateOfBirth: 'Datum narození'
      emails: 'E-mail'
      firstName: 'Jméno'
      gender: 'Pohlaví'
      lastName: 'Příjmení'
      role: 'Role'
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
