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

      <!-- Money still held is settled on purpose before deleting; the payments
           themselves stay on record either way. -->
      <q-card-section
        v-if="holdsMoney"
        class="q-pt-none column q-gutter-y-sm"
        data-test="registration-delete-settlement"
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
          <template #action>
            <q-btn
              :label="t('action.refundFirst')"
              color="primary"
              rounded
              flat
              no-caps
              data-test="registration-delete-refund-first"
              @click="refundFirst"
            />
          </template>
        </q-banner>
        <q-option-group
          v-model="settlement"
          :options="settlementOptions"
          data-test="registration-delete-settlement-options"
        />
      </q-card-section>

      <q-card-section>
        <q-select
          v-model="reason"
          :label="t('field.reason.label')"
          :hint="t('field.reason.hint')"
          :options="reasonOptions"
          emit-value
          map-options
          clearable
          outlined
          rounded
        />
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
          :disable="countdown > 0 || (holdsMoney && !settlement)"
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
import {
  type PaymentSettlement,
  REGISTRATION_DELETE_REASONS,
  type Registration,
  type RegistrationDeleteQuery,
  type RegistrationDeleteReason,
} from '@camp-registration/common/entities';
import { formatMoney } from '@camp-registration/common/utils';

defineEmits([...useDialogPluginComponent.emits]);

const { t, locale } = useI18n();
// Reason labels are shared with the audit log, which displays the stored code.
const { t: tGlobal } = useI18n({ useScope: 'global' });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { registration, hasTemplate } = defineProps<{
  registration: Registration;
  hasTemplate: boolean;
}>();

// What the person paid, net of refunds. Deleting keeps the payments on
// record; holding money, it has to be settled first.
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
const reason = ref<RegistrationDeleteReason | null>(null);

const reasonOptions = computed(() =>
  REGISTRATION_DELETE_REASONS.map((value) => ({
    value,
    label: tGlobal(`audit.entities.registration.reasons.${value}`),
  })),
);

const holdsMoney = computed<boolean>(() => registration.payment.amountPaid > 0);
const settlement = ref<PaymentSettlement | null>(null);
const settlementOptions = computed(() =>
  (['retained', 'settled_outside'] as const).map((value) => ({
    value,
    label: t(`settlement.${value}`),
  })),
);

function onConfirm() {
  onDialogOK({
    suppressMessage: hasTemplate ? !confirmationMessage.value : undefined,
    reason: reason.value ?? undefined,
    paymentSettlement: settlement.value ?? undefined,
  } satisfies RegistrationDeleteQuery);
}

// Leaves deleting for later: the caller opens the registration's payments.
function refundFirst() {
  onDialogOK({ refundFirst: true });
}
</script>

<style scoped></style>

<i18n locale="en" lang="yaml">
paidWarning: 'This person still has {amount} paid. The payments stay on record either way; choose how the money is settled, or refund it first.'
settlement:
  retained: 'Keep the money (e.g. as a cancellation fee)'
  settled_outside: 'Already given back outside the app (cash, bank transfer)'
title: 'Delete Registration'

text: 'Are you sure you want to delete the registration of {name}? This action cannot be undone.'

field:
  reason:
    label: 'Reason (optional)'
    hint: 'Saved in the audit log'
  sendAutomatedMessage:
    label: 'Send automated confirmation message'
  noTemplate: 'No message template configured — no notification will be sent.'

action:
  refundFirst: 'Refund first'
  delete: 'Delete'
  cancel: 'Cancel'
</i18n>

<i18n locale="de" lang="yaml">
paidWarning: 'Diese Person hat noch {amount} bezahlt. Die Zahlungen bleiben in jedem Fall erhalten; wähle, wie das Geld abgerechnet wird, oder erstatte es zuerst.'
settlement:
  retained: 'Geld behalten (z. B. als Stornogebühr)'
  settled_outside: 'Bereits außerhalb der App erstattet (bar, Überweisung)'
title: 'Anmeldung löschen'

text: 'Bist du sicher, dass du die Anmeldung von {name} löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.'

field:
  reason:
    label: 'Grund (optional)'
    hint: 'Wird im Aktivitätsprotokoll gespeichert'
  sendAutomatedMessage:
    label: 'Automatische Bestätigungsnachricht senden'
  noTemplate: 'Keine Nachrichtenvorlage konfiguriert — es wird keine Benachrichtigung gesendet.'

action:
  refundFirst: 'Zuerst erstatten'
  delete: 'Löschen'
  cancel: 'Abbrechen'
</i18n>

<i18n locale="fr" lang="yaml">
paidWarning: "Cette personne a encore {amount} payés. Les paiements restent enregistrés dans tous les cas ; choisissez comment l'argent est réglé, ou remboursez-le d'abord."
settlement:
  retained: "Garder l'argent (p. ex. comme frais d'annulation)"
  settled_outside: "Déjà remboursé en dehors de l'application (espèces, virement)"
title: "Supprimer l'inscription"

text: "Êtes-vous sûr de vouloir supprimer l'inscription de {name} ? Cette action est irréversible."

field:
  reason:
    label: 'Motif (facultatif)'
    hint: 'Enregistré dans le journal d’activité'
  sendAutomatedMessage:
    label: 'Envoyer un message de confirmation automatisé'
  noTemplate: 'Aucun modèle de message configuré — aucune notification ne sera envoyée.'

action:
  refundFirst: "Rembourser d'abord"
  delete: 'Supprimer'
  cancel: 'Annuler'
</i18n>

<i18n locale="pl" lang="yaml">
paidWarning: 'Ta osoba ma jeszcze zapłacone {amount}. Płatności zostaną zachowane w każdym przypadku; wybierz, jak rozliczyć pieniądze, albo najpierw dokonaj zwrotu.'
settlement:
  retained: 'Zatrzymaj pieniądze (np. jako opłatę za anulowanie)'
  settled_outside: 'Zwrócono już poza aplikacją (gotówka, przelew)'
title: 'Usuń rejestrację'

text: 'Czy na pewno chcesz usunąć rejestrację {name}? Tej akcji nie można cofnąć.'

field:
  reason:
    label: 'Powód (opcjonalnie)'
    hint: 'Zapisywany w dzienniku aktywności'
  sendAutomatedMessage:
    label: 'Wyślij zautomatyzowaną wiadomość potwierdzającą'
  noTemplate: 'Brak skonfigurowanego szablonu wiadomości — nie zostanie wysłane żadne powiadomienie.'

action:
  refundFirst: 'Najpierw zwrot'
  delete: 'Usuń'
  cancel: 'Anuluj'
</i18n>

<i18n locale="cs" lang="yaml">
paidWarning: 'Tato osoba má stále zaplaceno {amount}. Platby zůstanou v každém případě zachovány; vyber, jak se peníze vypořádají, nebo je nejprve vrať.'
settlement:
  retained: 'Ponechat peníze (např. jako storno poplatek)'
  settled_outside: 'Již vráceno mimo aplikaci (hotově, převodem)'
title: 'Smazat registraci'
text: 'Opravdu chcete smazat registraci {name}? Tuto akci nelze vrátit zpět.'

field:
  reason:
    label: 'Důvod (volitelné)'
    hint: 'Uloží se do deníku aktivit'
  sendAutomatedMessage:
    label: 'Odeslat automatickou potvrzovací zprávu'
  noTemplate: 'Žádná šablona zprávy není nakonfigurována — žádné oznámení nebude odesláno.'

action:
  refundFirst: 'Nejprve vrátit'
  delete: 'Smazat'
  cancel: 'Zrušit'
</i18n>
