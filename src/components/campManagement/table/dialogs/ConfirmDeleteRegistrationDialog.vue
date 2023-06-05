<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-card-section>
        <div class="text-h6">
          {{ t('title') }}
        </div>
      </q-card-section>

      <q-card-section>
        {{ t('text.consequence') }}
        <br />
        {{ t('text.explanation') }}
        <br />
        {{ t('text.property') }}
        <pre>
          {{ name }}
        </pre>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-model="confirmDeleteName"
          :label="t('input.label')"
          autofocus
          dense
          @keyup.enter="prompt = false"
        />
      </q-card-section>

      <q-card-actions
        align="right"
        class="text-primary"
      >
        <q-btn
          :disable="loading"
          :label="t('action.cancel')"
          flat
          outline
          @click="onDialogCancel"
        />
        <q-btn
          :disable="confirmDeleteDisabled"
          :label="t('action.delete')"
          :loading="loading"
          color="negative"
          @click="deleteItem"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar';
import { useRegistrationsStore } from 'stores/registration-store';

interface Props {
  result: unknown;
}

const props = defineProps<Props>();
defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const registrationStore = useRegistrationsStore();

const confirmDeleteName = ref<string>('');
const confirmDeleteDisabled = computed<boolean>(() => {
  return (
    confirmDeleteName.value.trim().toLowerCase() !==
    name.value?.trim().toLocaleLowerCase()
  );
});

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const loading = ref<boolean>(false);

const name = computed<string | undefined>(() => {
  const result = props.result;

  if (!isObject(result)) {
    return undefined;
  }

  if ('name' in result && typeof result.name === 'string') {
    return result.name;
  }

  if ('full_name' in result && typeof result.full_name === 'string') {
    return result.full_name;
  }

  const firstName =
    'first_name' in result && typeof result.first_name === 'string'
      ? result.first_name
      : undefined;

  const lastName =
    'last_name' in result && typeof result.last_name === 'string'
      ? result.last_name
      : undefined;

  return firstName !== undefined && lastName !== undefined
    ? `${firstName} + ${lastName}`
    : firstName !== undefined
    ? firstName
    : lastName;
});

async function deleteItem(): Promise<void> {
  const result = props.result;

  loading.value = true;
  const id = isIdentifiable(result) ? result.id : undefined;
  await registrationStore.deleteData(id);

  onDialogOK();
}

function isObject(value: unknown): value is object {
  return value != null && typeof value === 'object';
}

function isIdentifiable(value: unknown): value is { id: string } {
  return isObject(value) && 'id' in value && typeof value.id === 'string';
}
</script>

<i18n lang="yaml" locale="en">
title: 'Delete registration'
text:
  consequence: 'If you delete the registration, all data about the person may be lost.'
  explanation: "Type the user's name to confirm."
  property: 'Name:'
input:
  label: 'Name'
action:
  delete: 'Delete'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Anmeldung löschen'
text:
  consequence: 'Wenn Sie die Registrierung löschen, können alle Daten über die Person verloren gehen.'
  explanation: 'Geben Sie zur Bestätigung den Namen des Benutzers ein.'
  property: 'Name:'
input:
  label: 'Name'
action:
  delete: 'Löschen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Supprimer l'inscription"
text:
  consequence: "Si vous supprimez l'inscription, toutes les données relatives à la personne peuvent être perdues."
  explanation: "Saisissez le nom de l'utilisateur pour confirmer."
  property: 'Nom:'
input:
  label: 'Nom'
action:
  delete: 'Supprimer'
  cancel: 'Annuler'
</i18n>

<style scoped></style>
