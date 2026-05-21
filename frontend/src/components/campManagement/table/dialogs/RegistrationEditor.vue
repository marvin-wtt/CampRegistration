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
          ref="formRef"
          :camp-details="camp"
          :data="data"
          :submit-fn="onSubmit"
          :upload-file-fn="uploadFileFn"
          moderation
        />
      </q-scroll-area>

      <q-separator />

      <q-card-section class="q-py-sm q-px-md">
        <div class="row items-center">
          <div class="col">
            <q-checkbox
              v-if="hasTemplate"
              v-model="confirmationMessage"
              :label="t('field.sendAutomatedMessage.label')"
              color="primary"
              dense
            />
            <span
              v-else
              class="text-caption text-grey-7"
            >
              {{ t('field.noTemplate') }}
            </span>
          </div>

          <q-btn
            :label="t('action.save')"
            color="primary"
            rounded
            @click="handleSave"
          />
        </div>
      </q-card-section>
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
import { ref } from 'vue';

const quasar = useQuasar();
const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { camp, data, uploadFileFn, hasTemplate } = defineProps<{
  camp: CampDetails;
  data: Registration['data'];
  uploadFileFn: (file: File) => Promise<string>;
  hasTemplate: boolean;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const formRef = ref<InstanceType<typeof RegistrationForm>>();
const confirmationMessage = ref<boolean>(true);

function handleSave() {
  formRef.value?.submit();
}

function onSubmit(id: string, data: unknown) {
  onDialogOK({
    data,
    suppressMessage: hasTemplate ? !confirmationMessage.value : undefined,
  });
  // Error is handled elsewhere
  return Promise.resolve();
}
</script>

<i18n lang="yaml" locale="en">
title: 'Update registration'
field:
  sendAutomatedMessage:
    label: 'Send automated confirmation message'
  noTemplate: 'No message template configured — no notification will be sent.'
action:
  close: 'Close'
  save: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Anmeldung bearbeiten'
field:
  sendAutomatedMessage:
    label: 'Automatische Bestätigungsnachricht senden'
  noTemplate: 'Keine Nachrichtenvorlage konfiguriert — es wird keine Benachrichtigung gesendet.'
action:
  close: 'Schließen'
  save: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Modifier l'inscription"
field:
  sendAutomatedMessage:
    label: 'Envoyer un message de confirmation automatisé'
  noTemplate: 'Aucun modèle de message configuré — aucune notification ne sera envoyée.'
action:
  close: 'Fermer'
  save: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Edytuj zgłoszenie'
field:
  sendAutomatedMessage:
    label: 'Wyślij zautomatyzowaną wiadomość potwierdzającą'
  noTemplate: 'Brak skonfigurowanego szablonu wiadomości — nie zostanie wysłane żadne powiadomienie.'
action:
  close: 'Zamknij'
  save: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Upravit registraci'
field:
  sendAutomatedMessage:
    label: 'Odeslat automatickou potvrzovací zprávu'
  noTemplate: 'Žádná šablona zprávy není nakonfigurována — žádné oznámení nebude odesláno.'
action:
  close: 'Zavřít'
  save: 'Uložit'
</i18n>

<style></style>
