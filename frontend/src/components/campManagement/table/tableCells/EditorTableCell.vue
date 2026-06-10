<template>
  <div
    class="editor-cell row items-center no-wrap full-width full-height"
    :class="{ 'cursor-pointer': enabled }"
    @click="onCellClick()"
  >
    <!-- Displayed value — stays in the layout flow so the column keeps its
         natural width even while editing inline. -->
    <span
      class="ellipsis"
      :class="{ 'editor-cell__value--hidden': editMode && largeScreen }"
    >
      {{ cellProps.value }}
    </span>

    <!-- Inline editor (large screens) — rendered as an absolute overlay so it
         never widens the column; it only grows rightward as far as needed. -->
    <q-input
      v-if="editMode && largeScreen"
      v-model="modelValue"
      :disable="loading"
      class="editor-inline-input"
      autofocus
      dense
      outlined
      hide-bottom-space
      @keydown.enter="onSave"
      @keydown.esc="onCancel"
      @focusout="onCancel()"
      @click.stop
    >
      <template #append>
        <q-btn
          icon="close"
          size="sm"
          flat
          dense
          round
          @click.stop="onCancel"
        />
        <q-btn
          icon="check"
          size="sm"
          color="primary"
          :loading
          :disable="!!error"
          flat
          dense
          round
          @click="onSave"
        />
      </template>
    </q-input>

    <!-- Popup editor (small screens) -->
    <q-popup-proxy
      v-if="enabled && !largeScreen"
      v-model="editMode"
      no-parent-event
    >
      <q-card style="min-width: 280px">
        <q-card-section class="q-pb-none">
          <div class="text-subtitle1">{{ label }}</div>
          <div
            v-if="registrationName"
            class="text-caption text-grey-7"
          >
            {{ registrationName }}
          </div>
        </q-card-section>

        <q-card-section>
          <div
            v-if="error"
            class="row q-gutter-sm no-wrap text-negative q-mb-sm"
          >
            <q-icon
              name="error"
              size="sm"
              class="self-center"
            />
            <span>{{ error }} {{ t('error.hint') }}</span>
          </div>

          <q-input
            v-model="modelValue"
            :label
            :disable="loading || !!error"
            autofocus
            dense
            rounded
            outlined
            @keydown.enter="onSave"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            :label="t('action.cancel')"
            :disable="loading"
            rounded
            flat
            @click="onCancel"
          />
          <q-btn
            :label="t('action.save')"
            color="primary"
            :loading
            :disable="!!error"
            rounded
            @click="onSave"
          />
        </q-card-actions>
      </q-card>
    </q-popup-proxy>
  </div>
</template>

<script lang="ts" setup>
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import { computed, ref, watch, watchEffect } from 'vue';
import { useRegistrationsStore } from 'stores/registration-store';
import { updateObjectAtPath } from 'src/utils/updateObjectAtPath';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { usePermissions } from 'src/composables/permissions';
import { useQuasar } from 'quasar';

const { props: cellProps, printing } = defineProps<TableCellProps>();

const quasar = useQuasar();
const { t } = useI18n();
const { to } = useObjectTranslation();
const { can } = usePermissions();
const registrationsStore = useRegistrationsStore();

const editMode = ref<boolean>(false);
const loading = ref<boolean>(false);
const modelValue = ref<string>(getDefaultValue());

const label = computed<string>(() => to(cellProps.col.label));

const fieldName = computed<string | undefined>(() => {
  const fieldName = getStringValue(cellProps.col, 'fieldName');

  return fieldName?.startsWith('customData.')
    ? fieldName.substring('customData.'.length)
    : fieldName;
});

const registrationName = computed<string>(() => {
  return [
    cellProps.row.computedData.firstName,
    cellProps.row.computedData.lastName,
  ]
    .filter((name) => !!name)
    .join(' ');
});

const largeScreen = computed<boolean>(() => quasar.screen.gt.sm);

const registrationId = computed<string | undefined>(() =>
  getStringValue(cellProps.row, 'id'),
);

const enabled = computed<boolean>(() => {
  if (printing) {
    return false;
  }

  return can('camp.registrations.edit');
});

const error = computed<string | null>(() => {
  if (!registrationId.value) {
    return t('error.registration_id');
  }

  if (!fieldName.value) {
    return t('error.field_name');
  }

  return null;
});

watchEffect(() => {
  modelValue.value = getDefaultValue();
});

watch(editMode, (open) => {
  if (!open) {
    modelValue.value = getDefaultValue();
  }
});

function getDefaultValue(): string {
  if (cellProps.value == null) {
    return '';
  }

  if (cellProps.value && typeof cellProps.value === 'string') {
    return cellProps.value;
  }

  return 'Invalid value';
}

function onCancel() {
  modelValue.value = getDefaultValue();

  editMode.value = false;
}

function onSave() {
  if (registrationId.value === undefined || fieldName.value === undefined) {
    return;
  }

  loading.value = true;

  void registrationsStore
    .updateData(registrationId.value, {
      customData: updateObjectAtPath(
        getExistingCustomData(),
        fieldName.value,
        modelValue.value,
      ),
    })
    .then(() => {
      editMode.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
}

function getExistingCustomData(): Record<string, unknown> {
  if (
    'customData' in cellProps.row &&
    cellProps.row.customData != null &&
    typeof cellProps.row.customData === 'object'
  ) {
    return cellProps.row.customData;
  }

  return {};
}

function getStringValue(obj: object, key: string): string | undefined {
  const data = obj as Record<string, unknown>;

  if (data[key] != null && key in data && typeof data[key] === 'string') {
    return data[key];
  }

  return undefined;
}

function onCellClick() {
  if (!enabled.value) {
    return;
  }

  editMode.value = true;
}
</script>

<i18n lang="yaml" locale="en">
action:
  cancel: 'Cancel'
  save: 'Save'

error:
  hint: 'Please update the column definition.'
  registration_id: 'Registration ID was not found!'
  field_name: 'Field name is required!'
</i18n>

<i18n lang="yaml" locale="de">
action:
  cancel: 'Abbrechen'
  save: 'Speichern'

error:
  hint: 'Bitte aktualisieren Sie die Spaltendefinition.'
  registration_id: 'Registrierungs-ID wurde nicht gefunden!'
  field_name: 'Feldname ist erforderlich!'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  cancel: 'Annuler'
  save: 'Enregistrer'

error:
  hint: 'Veuillez mettre à jour la définition de la colonne.'
  registration_id: "L'ID d'enregistrement n'a pas été trouvé!"
  field_name: 'Le nom du champ est requis!'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  cancel: 'Anuluj'
  save: 'Zapisz'

error:
  hint: 'Zaktualizuj definicję kolumny.'
  registration_id: 'Nie znaleziono identyfikatora rejestracji!'
  field_name: 'Nazwa pola jest wymagana!'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  cancel: 'Zrušit'
  save: 'Uložit'

error:
  hint: 'Aktualizujte definici sloupce.'
  registration_id: 'ID registrace nebylo nalezeno!'
  field_name: 'Název pole je povinný!'
</i18n>

<style lang="scss" scoped>
.editor-cell {
  position: relative;
}

// Reserve the column width with the displayed value, but hide it visually while
// the inline editor overlays the cell (keeps layout, avoids a flash of text
// behind the input).
.editor-cell__value--hidden {
  visibility: hidden;
}

// The inline editor floats over the cell so it does not contribute to the
// column's content width. It fills the cell and only expands rightward (over
// the gutter / neighbouring cell) when the value needs more room than the
// column currently provides.
.editor-inline-input {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  z-index: 2;
  width: max-content;
  min-width: max(100%, 8rem);
  max-width: 24rem;

  :deep(.q-field__control) {
    // Opaque background so the part extending past the cell does not reveal
    // the content behind it.
    background: #fff;
    padding: 0 4px 0 8px;
  }

  :deep(.q-field__append) {
    padding-left: 2px;
  }
}

.body--dark .editor-inline-input :deep(.q-field__control) {
  background: #1d1d1d;
}
</style>
