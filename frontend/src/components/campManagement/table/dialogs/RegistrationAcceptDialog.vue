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
          :label="countdown > 0 ? countdown : t('action.accept')"
          :disable="countdown > 0"
          color="warning"
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
    supressMessage: !confirmationMessage.value,
  });
}
</script>

<style scoped></style>

<i18n locale="en" lang="yaml">
title: 'Accept Registration'

text: 'Are you sure you want to accept the registration of {name} from the waiting list? This action cannot be undone.'

field:
  sendAutomatedMessage:
    label: 'Send automated confirmation message'

action:
  accept: 'Accept'
  cancel: 'Cancel'
</i18n>

<i18n locale="de" lang="yaml">
title: 'Anmeldung Akzeptieren'

text: 'Sind Sie sicher, dass Sie die Anmeldung von {name} von der Warteliste akzeptieren möchten? Diese Aktion kann nicht rückgängig gemacht werden.'

field:
  sendAutomatedMessage:
    label: 'Automatische Bestätigungsnachricht senden'

action:
  accept: 'Akzeptieren'
  cancel: 'Abbrechen'
</i18n>

<i18n locale="fr" lang="yaml">
title: "Accepter l'inscription"

text: "Êtes-vous sûr de vouloir accepter l'inscription de {name} sur la liste d'attente ? Cette action est irréversible."

field:
  sendAutomatedMessage:
    label: 'Envoyer un message de confirmation automatisé'

action:
  accept: 'Accepter'
  cancel: 'Annuler'
</i18n>

<i18n locale="pl" lang="yaml">
title: 'Zaakceptuj rejestrację'

text: 'Czy na pewno chcesz zaakceptować rejestrację {name} z listy oczekujących? Tej akcji nie można cofnąć.'

field:
  sendAutomatedMessage:
    label: 'Wyślij zautomatyzowaną wiadomość potwierdzającą'

action:
  accept: 'Zaakceptuj'
  cancel: 'Anuluj'
</i18n>

<i18n locale="cs" lang="yaml">
title: 'Přijmout registraci'

text: 'Opravdu chcete přijmout registraci {name} ze seznamu čekatelů? Tuto akci nelze vrátit zpět.'

field:
  sendAutomatedMessage:
    label: 'Odeslat automatickou potvrzovací zprávu'

action:
  accept: 'Přijmout'
  cancel: 'Zrušit'
</i18n>
