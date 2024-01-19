<template>
  <q-dialog
    ref="dialogRef"
    full-height
    @hide="onDialogHide"
  >
    <q-card>
      <q-bar>
        <q-space />

        <q-btn
          v-close-popup
          icon="close"
          flat
          dense
        >
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <registration-form
        :camp-details="camp"
        :data="data"
        :submit-fn="onSubmit"
      />
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import 'survey-core/defaultV2.min.css';

import { useDialogPluginComponent } from 'quasar';
import type {
  CampDetails,
  Registration,
} from '@camp-registration/common/entities';
import RegistrationForm from 'components/common/RegistrationForm.vue';

interface Props {
  camp: CampDetails;
  data: Registration['data'];
}

const props = defineProps<Props>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

function onSubmit(id: string, data: object) {
  onDialogOK(data);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Edit data'
action:
  edit: 'Save'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Daten bearbeiten'
action:
  edit: 'Speichern'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier les données'
action:
  edit: 'Sauvegarder'
  cancel: 'Annuler'
</i18n>

<style></style>
