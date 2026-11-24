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

      <!-- Money it still holds is settled with the deletion (docs/payments.md). -->
      <q-card-section
        v-if="held > 0"
        data-test="registration-delete-settlement"
      >
        <div class="text-body2 q-mb-sm">
          {{ t('settlement.held', { amount: money(held, heldCurrency) }) }}
        </div>
        <q-option-group
          v-if="can('event.payments.refund')"
          v-model="settlement"
          :options="settlementOptions"
          color="primary"
        />
        <div
          v-else
          class="text-caption text-negative"
        >
          {{ t('settlement.forbidden') }}
        </div>
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
          :disable="countdown > 0 || (held > 0 && settlement === null)"
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
  PAYMENT_SETTLEMENTS,
  REGISTRATION_DELETE_REASONS,
  type PaymentSettlement,
  type Registration,
  type RegistrationDeleteReason,
} from '@camp-registration/common/entities';
import { usePermissions } from '@/composables/permissions';
import { useFinanceFormat } from '@/composables/financeFormat';
import { useFeeStore } from '@/stores/fee-store';

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
// Reason labels are shared with the audit log, which displays the stored code.
const { t: tGlobal } = useI18n({ useScope: 'global' });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { registration, hasTemplate } = defineProps<{
  registration: Registration;
  hasTemplate: boolean;
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

const { can } = usePermissions();
const { money } = useFinanceFormat();
const feeStore = useFeeStore();
if (can('event.payments.view')) {
  void feeStore.fetchData();
}
// Paid minus refunded: what the deletion has to settle.
const fee = computed(() => feeStore.byId.get(registration.id));
const held = computed(() => fee.value?.balance.amountPaid ?? 0);
const heldCurrency = computed(() => fee.value?.balance.currency);
const settlement = ref<PaymentSettlement | null>(null);
const settlementOptions = computed(() =>
  PAYMENT_SETTLEMENTS.map((value) => ({
    value,
    label: t(`settlement.${value}`),
  })),
);

const confirmationMessage = ref<boolean>(true);
const reason = ref<RegistrationDeleteReason | null>(null);

const reasonOptions = computed(() =>
  REGISTRATION_DELETE_REASONS.map((value) => ({
    value,
    label: tGlobal(`audit.entities.registration.reasons.${value}`),
  })),
);

function onConfirm() {
  onDialogOK({
    suppressMessage: hasTemplate ? !confirmationMessage.value : undefined,
    reason: reason.value ?? undefined,
    settlement: held.value > 0 ? (settlement.value ?? undefined) : undefined,
  });
}
</script>

<style scoped></style>

<i18n locale="en" lang="yaml">
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
  delete: 'Delete'
  cancel: 'Cancel'
settlement:
  held: 'It still holds {amount} in fees. What happens to it?'
  RETAINED: 'Kept, e.g. as a cancellation fee'
  SETTLED_OUTSIDE: 'Already given back outside the app'
  forbidden: 'Only someone who may refund fees can settle it. Ask the director or treasurer.'
</i18n>

<i18n locale="de" lang="yaml">
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
  delete: 'Löschen'
  cancel: 'Abbrechen'
settlement:
  held: 'Es sind noch {amount} an Beiträgen eingegangen. Was passiert damit?'
  RETAINED: 'Einbehalten, z. B. als Stornogebühr'
  SETTLED_OUTSIDE: 'Bereits außerhalb der App zurückgezahlt'
  forbidden: 'Nur wer Beiträge erstatten darf, kann das abrechnen. Frag die Leitung oder die Kasse.'
</i18n>

<i18n locale="fr" lang="yaml">
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
  delete: 'Supprimer'
  cancel: 'Annuler'
settlement:
  held: "Elle détient encore {amount} de frais. Qu'en faire ?"
  RETAINED: "Conservés, p. ex. comme frais d'annulation"
  SETTLED_OUTSIDE: "Déjà rendus hors de l'application"
  forbidden: 'Seule une personne autorisée à rembourser peut régler cela. Demandez à la direction ou à la trésorerie.'
</i18n>

<i18n locale="pl" lang="yaml">
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
  delete: 'Usuń'
  cancel: 'Anuluj'
settlement:
  held: 'Wpłynęło jeszcze {amount} opłat. Co z nimi zrobić?'
  RETAINED: 'Zatrzymane, np. jako opłata za rezygnację'
  SETTLED_OUTSIDE: 'Już zwrócone poza aplikacją'
  forbidden: 'Rozliczyć to może tylko osoba uprawniona do zwrotów. Zapytaj kierownictwo lub skarbnika.'
</i18n>

<i18n locale="cs" lang="yaml">
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
  delete: 'Smazat'
  cancel: 'Zrušit'
settlement:
  held: 'Obsahuje ještě {amount} na poplatcích. Co s nimi?'
  RETAINED: 'Ponechat, např. jako stornopoplatek'
  SETTLED_OUTSIDE: 'Už vráceno mimo aplikaci'
  forbidden: 'Vyúčtovat to může jen ten, kdo smí vracet poplatky. Zeptej se vedení nebo pokladny.'
</i18n>
