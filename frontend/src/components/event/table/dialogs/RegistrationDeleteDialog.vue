<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      :subtitle="personName"
      icon="delete_forever"
      :width="480"
      no-form
      @cancel="onDialogCancel"
    >
      <div class="column no-wrap delete-body">
        <p class="text-body2 q-my-none">{{ t('text') }}</p>

        <!-- Money it still holds is settled first (docs/payments.md): what
             goes back is refunded, what stays is kept on purpose. -->
        <section
          v-if="held > 0"
          class="fee-card rounded-lg bg-warning-container text-on-warning-container column no-wrap"
          data-test="registration-delete-settlement"
        >
          <div class="row items-center no-wrap fee-card__head">
            <q-icon
              name="payments"
              size="22px"
            />
            <span class="text-subtitle2 text-weight-medium">
              {{ t('fee.title', { amount: money(held, heldCurrency) }) }}
            </span>
          </div>
          <template v-if="can('event.payments.refund')">
            <span class="text-body2">{{ t('fee.text') }}</span>
            <q-checkbox
              v-model="keep"
              :label="t('fee.keep')"
              color="warning"
              dense
              data-test="registration-delete-keep"
            />
            <m-btn
              v-if="fee"
              :label="t('fee.refund')"
              icon="undo"
              color="warning"
              text-color="on-warning"
              allow-color
              rounded
              unelevated
              class="self-start"
              data-test="registration-delete-refund"
              @click="feeDialogs.details(fee)"
            />
          </template>
          <span
            v-else
            class="text-body2"
          >
            {{ t('fee.forbidden') }}
          </span>
        </section>

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

        <q-checkbox
          v-if="hasTemplate"
          v-model="confirmationMessage"
          :label="t('field.sendAutomatedMessage.label')"
          color="primary"
          dense
        />
        <span
          v-else
          class="text-caption text-on-surface-variant"
        >
          {{ t('field.noTemplate') }}
        </span>
      </div>

      <template #actions>
        <m-btn
          :label="t('action.cancel')"
          color="primary"
          text
          rounded
          @click="onDialogCancel"
        />
        <m-btn
          :label="
            countdown > 0
              ? `${t('action.delete')} (${countdown})`
              : t('action.delete')
          "
          :disable="countdown > 0 || (held > 0 && !keep)"
          color="negative"
          allow-color
          unelevated
          rounded
          data-test="registration-delete-submit"
          @click="onConfirm"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, onUnmounted, ref } from 'vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  REGISTRATION_DELETE_REASONS,
  type Registration,
  type RegistrationDeleteReason,
} from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import { usePermissions } from '@/composables/permissions';
import { useFinanceFormat } from '@/composables/financeFormat';
import { useFeeDialogs } from '@/composables/feeDialogs';
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
  const firstName = registration.computedData.firstName?.trim() ?? '';
  const lastName = registration.computedData.lastName?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName.length > 0 ? fullName : '?';
});

const { can } = usePermissions();
const { money } = useFinanceFormat();
const feeDialogs = useFeeDialogs();
const feeStore = useFeeStore();
if (can('event.payments.view')) {
  void feeStore.fetchData();
}
// Paid minus refunded: follows refunds made from here, through the store.
const fee = computed(() => feeStore.byId.get(registration.id));
const held = computed(() => fee.value?.balance.amountPaid ?? 0);
const heldCurrency = computed(() => fee.value?.balance.currency);
const keep = ref<boolean>(false);

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
    settlement: held.value > 0 && keep.value ? 'RETAINED' : undefined,
  });
}
</script>

<style scoped>
.delete-body {
  gap: 16px;
}

.fee-card {
  gap: 10px;
  padding: 14px 16px;
}

.fee-card__head {
  gap: 10px;
}
</style>

<i18n locale="en" lang="yaml">
title: 'Delete registration'
text: 'The registration is deleted for good. This cannot be undone.'

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

fee:
  title: '{amount} in fees received'
  text: 'Refund what goes back first. What stays is kept.'
  refund: 'Refund first'
  keep: 'Keep it, e.g. as a cancellation fee'
  forbidden: 'Only someone who may refund fees can settle it. Ask the director or treasurer.'
</i18n>

<i18n locale="de" lang="yaml">
title: 'Anmeldung löschen'
text: 'Die Anmeldung wird endgültig gelöscht. Das lässt sich nicht rückgängig machen.'

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

fee:
  title: '{amount} an Beiträgen eingegangen'
  text: 'Was zurückgeht, erstattest du vorher. Was bleibt, wird einbehalten.'
  refund: 'Erst erstatten'
  keep: 'Einbehalten, z. B. als Stornogebühr'
  forbidden: 'Nur wer Beiträge erstatten darf, kann das abrechnen. Frag die Leitung oder die Kasse.'
</i18n>

<i18n locale="fr" lang="yaml">
title: "Supprimer l'inscription"
text: "L'inscription sera supprimée définitivement. Cette action est irréversible."

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

fee:
  title: '{amount} de frais reçus'
  text: "Remboursez d'abord ce qui doit être rendu. Le reste est conservé."
  refund: "Rembourser d'abord"
  keep: "Conserver, p. ex. comme frais d'annulation"
  forbidden: 'Seule une personne autorisée à rembourser peut régler cela. Demandez à la direction ou à la trésorerie.'
</i18n>

<i18n locale="pl" lang="yaml">
title: 'Usuń rejestrację'
text: 'Rejestracja zostanie trwale usunięta. Tej akcji nie można cofnąć.'

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

fee:
  title: 'Wpłynęło {amount} opłat'
  text: 'Najpierw zwróć to, co ma wrócić. Reszta zostanie zatrzymana.'
  refund: 'Najpierw zwróć'
  keep: 'Zatrzymaj, np. jako opłatę za rezygnację'
  forbidden: 'Rozliczyć to może tylko osoba uprawniona do zwrotów. Zapytaj kierownictwo lub skarbnika.'
</i18n>

<i18n locale="cs" lang="yaml">
title: 'Smazat registraci'
text: 'Registrace bude trvale smazána. Tuto akci nelze vrátit zpět.'

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

fee:
  title: 'Přijato {amount} na poplatcích'
  text: 'Co se má vrátit, nejdřív vrať. Zbytek zůstane ponechán.'
  refund: 'Nejdřív vrátit'
  keep: 'Ponechat, např. jako stornopoplatek'
  forbidden: 'Vyúčtovat to může jen ten, kdo smí vracet poplatky. Zeptej se vedení nebo pokladny.'
</i18n>
