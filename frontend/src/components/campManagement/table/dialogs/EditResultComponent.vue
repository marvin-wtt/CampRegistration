<template>
  <q-dialog
    ref="dialogRef"
    full-height
    full-width
    @hide="onDialogHide"
  >
    <q-card class="column">
      <q-bar class="col-shrink">
        {{ t('title') }}

        <q-space />

        <q-btn
          v-close-popup
          icon="close"
          flat
          dense
          @click="onDialogCancel"
        >
          <q-tooltip>
            {{ t('action.close') }}
          </q-tooltip>
        </q-btn>
      </q-bar>

      <q-scroll-area class="col-grow">
        <registration-form
          :camp-details="camp"
          :data="data"
          :submit-fn="onSubmit"
          :upload-file-fn="onFileUpload"
          moderation
        />

        <div class="q-px-md q-pb-md">
          <q-input
            v-model="note"
            :label="t('field.note.label')"
            :hint="t('field.note.hint')"
            autogrow
            dense
            outlined
            type="textarea"
          />
        </div>
      </q-scroll-area>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import type {
  CampDetails,
  Registration,
} from '@camp-registration/common/entities';
import RegistrationForm from 'components/common/RegistrationForm.vue';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';

const props = defineProps<{
  camp: CampDetails;
  data: Registration['data'];
  uploadFileFn: (file: File) => Promise<string>;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const note = ref<string>('');

function onSubmit(_id: string, data: unknown) {
  onDialogOK({ data, note: note.value || undefined });
  // Error is handled elsewhere
  return Promise.resolve();
}

async function onFileUpload(file: File) {
  return props.uploadFileFn(file);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Update registration'
field:
  note:
    label: 'Note (optional)'
    hint: 'Add a short note about this change'
action:
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Anmeldung bearbeiten'
field:
  note:
    label: 'Notiz (optional)'
    hint: 'Fügen Sie eine kurze Notiz zu dieser Änderung hinzu'
action:
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Modifier l'inscription"
field:
  note:
    label: 'Note (optionnelle)'
    hint: 'Ajoutez une courte note sur cette modification'
action:
  close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Edytuj zgłoszenie'
field:
  note:
    label: 'Notatka (opcjonalna)'
    hint: 'Dodaj krótką notatkę o tej zmianie'
action:
  close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Upravit registraci'
field:
  note:
    label: 'Poznámka (volitelná)'
    hint: 'Přidejte krátkou poznámku k této změně'
action:
  close: 'Zavřít'
</i18n>

<style></style>
