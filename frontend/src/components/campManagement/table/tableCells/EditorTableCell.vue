<template>
  <div
    v-if="enabled"
    class="editor-cell row items-center no-wrap full-width full-height cursor-pointer"
    :class="{ 'editor-cell--grid': gridMode }"
    @click="onCellClick()"
  >
    <!-- Displayed value (hidden while editing inline so the input takes the
         cell and the row grows in height to fit it). -->
    <div
      v-if="!(editMode && largeScreen)"
      class="row items-center no-wrap full-width"
    >
      <div class="editor-value col ellipsis">
        <default-table-cell
          :props="cellProps"
          :camp="camp"
          :printing="printing"
          :grid-mode="gridMode"
        />
      </div>

      <!-- Edit affordance for editable cells. -->
      <q-icon
        class="editor-edit-icon"
        name="edit"
        size="18px"
      />
    </div>

    <!-- Inline editor (large screens) — in-flow, so the row grows in height to
         fit it while staying within the column's width. -->
    <q-input
      v-else
      v-model="modelValue"
      :disable="loading"
      class="editor-inline-input full-width"
      type="textarea"
      autogrow
      autofocus
      dense
      outlined
      hide-bottom-space
      @keydown.enter.exact.prevent="onSave"
      @keydown.esc="onCancel"
      @focusout="onBlurCommit()"
      @click.stop
    >
      <template #append>
        <q-btn
          icon="close"
          size="sm"
          flat
          dense
          round
          @mousedown.prevent
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
          @mousedown.prevent
          @click.stop="onSave"
        />
      </template>
    </q-input>

    <!-- Popup editor (small screens) -->
    <q-dialog
      v-if="!largeScreen"
      v-model="editMode"
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
            type="textarea"
            autogrow
            autofocus
            dense
            rounded
            outlined
            clearable
            @clear="clearValue"
            @keydown.enter.exact.prevent="onSave"
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
    </q-dialog>

    <q-inner-loading
      :showing="loading"
      color="primary"
      size="24px"
    />
  </div>

  <default-table-cell
    v-else
    :props="cellProps"
    :camp="camp"
    :printing="printing"
    :grid-mode="gridMode"
  />
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
import { formatPersonName } from 'src/utils/formatters';
import { deepToRaw } from 'src/utils/deepToRaw';
import DefaultTableCell from 'components/campManagement/table/tableCells/DefaultTableCell.vue';

const {
  props: cellProps,
  camp,
  printing,
  gridMode = false,
} = defineProps<TableCellProps>();

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
  const fullName = [
    cellProps.row.computedData.firstName,
    cellProps.row.computedData.lastName,
  ]
    .filter((name) => !!name)
    .join(' ');

  return formatPersonName(fullName);
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

function clearValue() {
  modelValue.value = '';
}

function onCancel() {
  // watch(editMode) discards the unsaved value when the editor closes.
  editMode.value = false;
}

function onBlurCommit() {
  if (loading.value) {
    return;
  }

  // Auto-save when focus leaves the editor, but only if the value actually
  // changed and the column config is valid — otherwise just close without an
  // API call. The dirty check also stops the focusout fired while unmounting
  // after Esc/✕ (which reset modelValue first) from re-saving.
  if (error.value || modelValue.value === getDefaultValue()) {
    onCancel();
    return;
  }

  onSave();
}

function onSave() {
  if (registrationId.value === undefined || fieldName.value === undefined) {
    return;
  }

  loading.value = true;

  void registrationsStore
    .updateData(registrationId.value, {
      customData: updateObjectAtPath(
        structuredClone(deepToRaw(getExistingCustomData())),
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

  // editMode drives the inline editor (large screens) and the dialog (small).
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
// Anchor the q-inner-loading overlay shown while saving.
.editor-cell {
  position: relative;
  min-width: 8rem;
}

// Editability affordance: highlight the cell on hover when it can be edited.
.editor-cell.cursor-pointer {
  border-radius: 4px;
  transition:
    background-color 120ms ease,
    box-shadow 120ms ease;

  &:hover {
    background: rgba(var(--md3-primary-rgb), 0.1);
    box-shadow: inset 0 0 0 1px var(--md3-primary);

    .editor-edit-icon {
      color: var(--md3-primary);
    }
  }
}

// Outside the table (e.g. row card dialog) there is no cell height to fill, so
// give the row a tappable height of its own instead of relying on full-height.
.editor-cell--grid {
  min-height: 36px;
}

// Let the value shrink so it ellipsizes instead of pushing the icon past the
// trailing edge of the cell.
.editor-value {
  min-width: 0;
}

// Keep the edit affordance pinned to the trailing edge of the row.
.editor-edit-icon {
  flex: none;
  margin-left: auto;
  color: var(--md3-on-surface-variant);
}

// The inline editor sits in the normal flow: the row grows in height to fit it.
// min-width: 0 lets the field shrink to the column width so it does not widen
// the column more than the input genuinely needs (the action buttons).
.editor-inline-input {
  min-width: 8rem;

  :deep(.q-field__control) {
    padding: 0 4px 0 8px;
  }

  // In an auto-layout table the column is sized to the input's preferred width,
  // which comes from the native input's default `size="20"` (~20 chars) and
  // would inflate the column while editing. A *definite* width overrides that
  // intrinsic width (a percentage width would be treated as the intrinsic ~20ch
  // and not help). Setting it to a small value lets the column grow to at least
  // that minimum so the editor stays usable on narrow columns; min-width: 100%
  // (a percentage, so it contributes nothing to intrinsic sizing) then stretches
  // the input to fill wider columns.
  :deep(.q-field__native) {
    width: 0;
    min-width: 100%;
  }

  :deep(.q-field__append) {
    padding-left: 2px;
  }
}
</style>
