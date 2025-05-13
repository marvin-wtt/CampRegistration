<template>
  <q-dialog
    ref="dialogRef"
    full-height
    full-width
    :maximized="quasar.screen.lt.lg"
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
      </q-scroll-area>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent, useQuasar } from 'quasar';
import type {
  CampDetails,
  Registration,
} from '@camp-registration/common/entities';
import RegistrationForm from 'components/common/RegistrationForm.vue';
import { useI18n } from 'vue-i18n';

interface Props {
  camp: CampDetails;
  data: Registration['data'];
  uploadFileFn: (file: File) => Promise<string>;
}

const props = defineProps<Props>();
defineEmits([...useDialogPluginComponent.emits]);

const quasar = useQuasar();
const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

function onSubmit(id: string, data: unknown) {
  onDialogOK(data);
  // Error is handled elsewhere
  return Promise.resolve();
}

async function onFileUpload(file: File) {
  return props.uploadFileFn(file);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Update registration'
action:
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Anmeldung bearbeiten'
action:
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Modifier l'inscription"
action:
  close: 'Fermer'
</i18n>

<style></style>
