<template>
  <q-dialog
    ref="dialogRef"
    full-height
    full-width
    :maximized="quasar.screen.lt.sm"
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
          readonly
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
import RegistrationForm from '@/components/common/RegistrationForm.vue';
import { useI18n } from 'vue-i18n';

const quasar = useQuasar();
const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();

defineProps<{
  camp: CampDetails;
  data: Registration['data'];
}>();

defineEmits([...useDialogPluginComponent.emits]);
</script>

<i18n lang="yaml" locale="en">
title: 'Form data'
action:
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Formulardaten'
action:
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Données du formulaire'
action:
  close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Dane formularza'
action:
  close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Data formuláře'
action:
  close: 'Zavřít'
</i18n>

<style></style>
