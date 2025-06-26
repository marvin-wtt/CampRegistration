<template>
  {{ cellProps.value }}

  <q-popup-proxy v-model="popupState">
    <q-banner>
      <div
        class="column q-gutter-sm q-ma-xs"
        style="min-width: 250px"
      >
        <a>
          {{ label }}
        </a>

        <q-input
          v-model="modelValue"
          :label
          autofocus
          dense
          rounded
          outlined
        />

        <div class="row justify-end">
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
            :disable="!registrationId || !fieldName"
            rounded
            @click="onSave"
          />
        </div>
      </div>
    </q-banner>
  </q-popup-proxy>
</template>

<script lang="ts" setup>
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import { computed, ref, watch, watchEffect } from 'vue';
import { useRegistrationsStore } from 'stores/registration-store';
import { updateObjectAtPath } from 'src/utils/updateObjectAtPath';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from 'src/composables/objectTranslation';

const { props: cellProps } = defineProps<TableCellProps>();

const { t } = useI18n();
const { to } = useObjectTranslation();
const registrationsStore = useRegistrationsStore();

const popupState = ref<boolean>(false);
const loading = ref<boolean>(false);
const modelValue = ref<string>(getDefaultValue());

const label = computed<string>(() => to(cellProps.col.label));

const fieldName = computed<string | undefined>(() => {
  const fieldName = getStringValue(cellProps.col, 'fieldName');

  return fieldName?.startsWith('customData.')
    ? fieldName.substring('customData.'.length)
    : fieldName;
});

const registrationId = computed<string | undefined>(() =>
  getStringValue(cellProps.row, 'id'),
);

watchEffect(() => {
  modelValue.value = getDefaultValue();
});

watch(popupState, (open) => {
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

  return String(cellProps.value);
}

function onCancel() {
  modelValue.value = getDefaultValue();

  popupState.value = false;
}

function onSave() {
  if (registrationId.value === undefined || fieldName.value === undefined) {
    return;
  }

  loading.value = true;
  try {
    registrationsStore.updateData(registrationId.value, {
      customData: updateObjectAtPath(
        getExistingCustomData(),
        fieldName.value,
        modelValue.value,
      ),
    });

    popupState.value = false;
  } finally {
    loading.value = false;
  }
}

function getExistingCustomData(): Record<string, unknown> {
  if (
    'customData' in cellProps.row &&
    cellProps.row.customData != null &&
    typeof cellProps.row.customData === 'object'
  ) {
    return cellProps.row.customData as Record<string, unknown>;
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
</script>

<i18n lang="yaml" locale="en">
action:
  cancel: 'Cancel'
  save: 'Save'
</i18n>
<i18n lang="yaml" locale="de">
action:
  cancel: 'Abbrechen'
  save: 'Speichern'
</i18n>
<i18n lang="yaml" locale="fr">
action:
  cancel: 'Annuler'
  save: 'Enregistrer'
</i18n>

<style lang="scss" scoped></style>
