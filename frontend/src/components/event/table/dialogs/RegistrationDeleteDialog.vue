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

      <q-card-section
        v-if="registration.payment.amountPaid > 0"
        class="q-pt-none"
      >
        <q-banner
          dense
          rounded
          class="bg-warning-container text-on-warning-container text-body2"
          data-test="registration-delete-paid-warning"
        >
          <template #avatar>
            <q-icon name="payments" />
          </template>
          {{ t('paidWarning', { amount: paidAmount }) }}
        </q-banner>
      </q-card-section>

      <q-card-section>
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
import type { Registration } from '@camp-registration/common/entities';
import { formatMoney } from '@camp-registration/common/utils';

defineEmits([...useDialogPluginComponent.emits]);

const { t, locale } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { registration, hasTemplate } = defineProps<{
  registration: Registration;
  hasTemplate: boolean;
}>();

// Money already received isn't returned by deleting — the ledger outlives
// the registration, so the manager has to refund it explicitly first.
const paidAmount = computed<string>(() =>
  formatMoney(
    registration.payment.amountPaid,
    registration.payment.currency,
    locale.value,
  ),
);

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
    suppressMessage: hasTemplate ? !confirmationMessage.value : undefined,
  });
}
</script>

<style scoped></style>

<i18n locale="en" lang="yaml">
paidWarning: 'This person has paid {amount}. Deleting the registration does not refund it — refund it first from the payments in the registration details. Payment records are kept.'
title: 'Delete Registration'

text: 'Are you sure you want to delete the registration of {name}? This action cannot be undone.'

field:
  sendAutomatedMessage:
    label: 'Send automated confirmation message'
  noTemplate: 'No message template configured — no notification will be sent.'

action:
  delete: 'Delete'
  cancel: 'Cancel'
</i18n>

<i18n locale="de" lang="yaml">
paidWarning: 'Diese Person hat {amount} bezahlt. Das Löschen der Anmeldung erstattet den Betrag nicht — erstatte ihn zuerst über die Zahlungen in den Anmeldedetails. Zahlungsdaten bleiben erhalten.'
title: 'Anmeldung löschen'

text: 'Sind Sie sicher, dass Sie die Anmeldung von {name} löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.'

field:
  sendAutomatedMessage:
    label: 'Automatische Bestätigungsnachricht senden'
  noTemplate: 'Keine Nachrichtenvorlage konfiguriert — es wird keine Benachrichtigung gesendet.'

action:
  delete: 'Löschen'
  cancel: 'Abbrechen'
</i18n>

<i18n locale="fr" lang="yaml">
paidWarning: "Cette personne a payé {amount}. Supprimer l'inscription ne la rembourse pas — remboursez-la d'abord depuis les paiements dans les détails de l'inscription. Les données de paiement sont conservées."
title: "Supprimer l'inscription"

text: "Êtes-vous sûr de vouloir supprimer l'inscription de {name} ? Cette action est irréversible."

field:
  sendAutomatedMessage:
    label: 'Envoyer un message de confirmation automatisé'
  noTemplate: 'Aucun modèle de message configuré — aucune notification ne sera envoyée.'

action:
  delete: 'Supprimer'
  cancel: 'Annuler'
</i18n>

<i18n locale="pl" lang="yaml">
paidWarning: 'Ta osoba zapłaciła {amount}. Usunięcie zgłoszenia nie powoduje zwrotu — najpierw zwróć kwotę w sekcji płatności w szczegółach zgłoszenia. Dane płatności zostaną zachowane.'
title: 'Usuń rejestrację'

text: 'Czy na pewno chcesz usunąć rejestrację {name}? Tej akcji nie można cofnąć.'

field:
  sendAutomatedMessage:
    label: 'Wyślij zautomatyzowaną wiadomość potwierdzającą'
  noTemplate: 'Brak skonfigurowanego szablonu wiadomości — nie zostanie wysłane żadne powiadomienie.'

action:
  delete: 'Usuń'
  cancel: 'Anuluj'
</i18n>

<i18n locale="cs" lang="yaml">
paidWarning: 'Tato osoba zaplatila {amount}. Smazáním registrace se částka nevrací — nejprve ji vraťte v platbách v detailu registrace. Záznamy o platbách zůstanou zachovány.'
title: 'Smazat registraci'
text: 'Opravdu chcete smazat registraci {name}? Tuto akci nelze vrátit zpět.'

field:
  sendAutomatedMessage:
    label: 'Odeslat automatickou potvrzovací zprávu'
  noTemplate: 'Žádná šablona zprávy není nakonfigurována — žádné oznámení nebude odesláno.'

action:
  delete: 'Smazat'
  cancel: 'Zrušit'
</i18n>
