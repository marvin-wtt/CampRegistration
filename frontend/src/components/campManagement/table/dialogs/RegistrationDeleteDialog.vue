<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="text-h6">
        {{ t('title') }}
      </q-card-section>

      <q-card-section class="q-pt-none">
        <i18n-t
          keypath="text"
          tag="p"
        >
          <template #name>
            <i>
              <strong>{{ personName }}</strong>
            </i>
          </template>
        </i18n-t>
      </q-card-section>

      <q-card-section>
        <q-checkbox
          v-model="confirmationMessage"
          :label="t('field.sendAutomatedMessage.label')"
          color="primary"
          dense
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          :label="t('action.cancel')"
          color="primary"
          rounded
          outline
          @click="onDialogCancel"
        />
        <q-btn
          :label="countdown > 0 ? countdown : t('action.delete')"
          :disable="countdown > 0"
          color="negative"
          rounded
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, onUnmounted, ref } from 'vue';
import type { Camp, Registration } from '@camp-registration/common/entities';

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { registration } = defineProps<{
  registration: Registration;
  camp: Camp;
}>();

onUnmounted(() => {
  clearInterval(interval);
});

const countdown = ref<number>(3);

const interval = setInterval(() => {
  countdown.value -= 1;

  if (countdown.value <= 0) {
    clearInterval(interval);
  }
}, 1000);

const personName = computed<string>(() => {
  const firstName = registration.computedData.firstName?.trim();
  const lastName = registration.computedData.lastName?.trim();

  return `${firstName} ${lastName}`;
});

const confirmationMessage = ref<boolean>(true);

function onConfirm() {
  onDialogOK({
    suppressMessage: !confirmationMessage.value,
  });
}
</script>

<style scoped></style>

<i18n locale="en" lang="yaml">
title: 'Delete Registration'

text: 'Are you sure you want to delete the registration of {name}? This action cannot be undone.'

field:
  sendAutomatedMessage:
    label: 'Send automated confirmation message'

action:
  delete: 'Delete'
  cancel: 'Cancel'
</i18n>

<i18n locale="de" lang="yaml">
title: 'Anmeldung löschen'

text: 'Sind Sie sicher, dass Sie die Anmeldung von {name} löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.'

field:
  sendAutomatedMessage:
    label: 'Automatische Bestätigungsnachricht senden'

action:
  delete: 'Löschen'
  cancel: 'Abbrechen'
</i18n>

<i18n locale="fr" lang="yaml">
title: "Supprimer l'inscription"

text: "Êtes-vous sûr de vouloir supprimer l'inscription de {name} ? Cette action est irréversible."

field:
  sendAutomatedMessage:
    label: 'Envoyer un message de confirmation automatisé'

action:
  delete: 'Supprimer'
  cancel: 'Annuler'
</i18n>

<i18n locale="pl" lang="yaml">
title: 'Usuń rejestrację'

text: 'Czy na pewno chcesz usunąć rejestrację {name}? Tej akcji nie można cofnąć.'

field:
  sendAutomatedMessage:
    label: 'Wyślij zautomatyzowaną wiadomość potwierdzającą'

action:
  delete: 'Usuń'
  cancel: 'Anuluj'
</i18n>

<i18n locale="cs" lang="yaml">
title: 'Smazat registraci'
text: 'Opravdu chcete smazat registraci {name}? Tuto akci nelze vrátit zpět.'

field:
  sendAutomatedMessage:
    label: 'Odeslat automatickou potvrzovací zprávu'

action:
  delete: 'Smazat'
  cancel: 'Zrušit'
</i18n>
