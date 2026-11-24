<template>
  <!-- One registration's fee. It stays open: its actions open on top. -->
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="name"
      :subtitle="fee.reference"
      no-form
      closable
      @cancel="onDialogCancel"
    >
      <template #avatar>
        <q-avatar
          color="primary-container"
          text-color="on-primary-container"
          icon="payments"
          class="q-mr-md"
        />
      </template>
      <template
        v-if="menu.length > 0"
        #header-actions
      >
        <responsive-menu
          :items="menu"
          :label="t('actions')"
          :title="`${name} · ${fee.reference}`"
        />
      </template>

      <div class="column no-wrap q-gutter-y-sm">
        <finance-hero
          :amount="money(headline, currency)"
          :caption="headlineCaption"
        />
        <div class="row justify-center">
          <payment-status-chip :status="fee.balance.status" />
        </div>

        <q-list>
          <detail-row
            icon="tag"
            :label="t('reference')"
            :value="fee.reference"
            clickable
            @click="copyReference"
          >
            <template #side>
              <q-icon
                name="content_copy"
                size="20px"
              />
            </template>
          </detail-row>
          <detail-row
            icon="request_quote"
            :label="t('amountDue')"
            :value="amountDueText"
          />
          <detail-row
            v-if="fee.amountDue.override !== null"
            icon="edit_note"
            :label="t('adjusted')"
            :value="fee.amountDue.note ?? t('noNote')"
          />
          <detail-row
            v-if="fee.amountDue.reductions > 0"
            icon="event_busy"
            :label="t('cancelled')"
            :value="`−${money(fee.amountDue.reductions, currency)}`"
          />
          <detail-row
            v-if="fee.status !== 'ACCEPTED'"
            icon="info"
            :label="t('status')"
            :value="t(`registrationStatus.${fee.status}`)"
            warn
          />
        </q-list>

        <div class="text-overline text-on-surface-variant q-px-sm">
          {{ t('ledger') }}
        </div>
        <div
          v-if="fee.payments.length === 0"
          class="text-body2 text-on-surface-variant q-px-sm"
        >
          {{ t('noPayments') }}
        </div>
        <q-list
          v-else
          class="ledger rounded-lg"
        >
          <template
            v-for="payment in fee.payments"
            :key="payment.id"
          >
            <q-item data-test="fee-payment">
              <q-item-section avatar>
                <q-icon
                  :name="METHOD_ICONS[payment.method]"
                  color="on-surface-variant"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ t(`finance.fee.method.${payment.method}`) }}
                </q-item-label>
                <q-item-label caption>
                  {{ d(parseLocalDate(payment.paidOn), 'date') }}
                  <template v-if="payment.note">· {{ payment.note }}</template>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <span class="text-amount text-on-surface">
                  {{ money(payment.amount, payment.currency) }}
                </span>
              </q-item-section>
              <q-item-section
                v-if="paymentMenu(payment).length > 0"
                side
              >
                <responsive-menu
                  :items="paymentMenu(payment)"
                  :label="t('actions')"
                  size="sm"
                />
              </q-item-section>
            </q-item>
            <q-item
              v-for="refund in payment.refunds"
              :key="refund.id"
              class="refund"
              data-test="fee-refund"
            >
              <q-item-section avatar>
                <q-icon
                  name="subdirectory_arrow_right"
                  color="tertiary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{
                    refund.amountDueReduction > 0
                      ? t('refundCancellation')
                      : t('refund')
                  }}
                </q-item-label>
                <q-item-label caption>
                  {{ d(parseLocalDate(refund.refundedOn), 'date') }}
                  <template v-if="refund.reason"
                    >· {{ refund.reason }}</template
                  >
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <span class="text-amount text-tertiary">
                  −{{ money(refund.amount, payment.currency) }}
                </span>
              </q-item-section>
              <q-item-section
                v-if="can('event.payments.refund')"
                side
              >
                <responsive-menu
                  :items="refundMenu(payment, refund)"
                  :label="t('actions')"
                  size="sm"
                />
              </q-item-section>
            </q-item>
          </template>
        </q-list>
      </div>

      <!-- Paying and paying back; an excess makes giving back the next step. -->
      <template
        v-if="can('event.payments.create') || canRefund"
        #actions
      >
        <m-btn
          v-if="canRefund"
          :label="t('refundAction')"
          icon="undo"
          :text="!overpaid"
          :unelevated="overpaid"
          rounded
          color="primary"
          data-test="fee-refund-action"
          @click="dialogs.refundFee(fee)"
        />
        <m-btn
          v-if="can('event.payments.create')"
          :label="t('record')"
          icon="add_card"
          :text="overpaid"
          :unelevated="!overpaid"
          rounded
          color="primary"
          data-test="fee-record"
          @click="dialogs.record(fee)"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { copyToClipboard, useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type {
  Payment,
  PaymentMethod,
  PaymentRefund,
  RegistrationFee,
} from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import ResponsiveMenu, {
  type ResponsiveMenuItem,
} from '@/components/common/ResponsiveMenu.vue';
import DetailRow from '@/components/event/finances/DetailRow.vue';
import FinanceHero from '@/components/event/finances/FinanceHero.vue';
import PaymentStatusChip from '@/components/event/finances/fees/PaymentStatusChip.vue';
import { useFeeDialogs } from '@/composables/feeDialogs';
import { useFinanceFormat } from '@/composables/financeFormat';
import { usePermissions } from '@/composables/permissions';
import { useFeeStore } from '@/stores/fee-store';
import { parseLocalDate } from '@/utils/date';
import { feeName } from '@/utils/registrationFee';

const { fee: opened } = defineProps<{
  /** As opened; the dialog then follows the store's copy. */
  fee: RegistrationFee;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();

const METHOD_ICONS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'account_balance',
  CASH: 'payments',
  OTHER: 'more_horiz',
};

const quasar = useQuasar();
const { t, d } = useI18n();
const { money } = useFinanceFormat();
const { can } = usePermissions();
const feeStore = useFeeStore();
const dialogs = useFeeDialogs();

const current = computed(() => feeStore.byId.get(opened.id) ?? null);
const fee = computed(() => current.value ?? opened);
const name = computed(() => feeName(fee.value));
const currency = computed(() => fee.value.balance.currency);

// Deleted, here or elsewhere: nothing left to show.
watch(current, (found) => {
  if (found === null) {
    onDialogCancel();
  }
});

// What needs doing leads: what is open, an excess, or what came in.
const headline = computed(() => {
  const { outstanding, overpaid, amountPaid } = fee.value.balance;
  return outstanding > 0 ? outstanding : overpaid > 0 ? overpaid : amountPaid;
});
const headlineCaption = computed(() => {
  const { outstanding, overpaid } = fee.value.balance;
  return outstanding > 0
    ? t('stillOpen')
    : overpaid > 0
      ? t('overpaid')
      : t('paid');
});

const canRefund = computed(
  () =>
    can('event.payments.refund') &&
    fee.value.payments.some((p) => p.refundable > 0),
);
const overpaid = computed(() => fee.value.balance.overpaid > 0);

const amountDueText = computed(() => {
  const due = fee.value.balance.amountDue;
  return due === null ? t('noAmountDue') : money(due, currency.value);
});

const menu = computed<ResponsiveMenuItem[]>(() =>
  can('event.payments.adjust')
    ? [
        {
          label: t('setAmountDue'),
          icon: 'price_change',
          onClick: () => dialogs.amountDue(fee.value),
        },
      ]
    : [],
);

function paymentMenu(payment: Payment): ResponsiveMenuItem[] {
  return [
    {
      label: t('refundAction'),
      icon: 'undo',
      hidden: !can('event.payments.refund') || payment.refundable === 0,
      onClick: () => dialogs.refund(payment, fee.value),
    },
    {
      label: t('deletePayment'),
      icon: 'delete',
      color: 'negative',
      hidden: !can('event.payments.adjust'),
      onClick: () => confirmDeletePayment(payment),
    },
  ].filter((item) => !item.hidden);
}

function refundMenu(
  payment: Payment,
  refund: PaymentRefund,
): ResponsiveMenuItem[] {
  return [
    {
      label: t('deleteRefund'),
      icon: 'delete',
      color: 'negative',
      onClick: () => confirmDeleteRefund(payment, refund),
    },
  ];
}

// Deleting is for recording errors; the audit log keeps the amounts.
function confirmDeletePayment(payment: Payment) {
  quasar
    .dialog({
      title: t('deletePaymentTitle'),
      message: t('deletePaymentMessage', {
        amount: money(payment.amount, payment.currency),
      }),
      ok: { label: t('delete'), color: 'negative', rounded: true },
      cancel: {
        label: t('finance.action.cancel'),
        color: 'primary',
        flat: true,
        rounded: true,
      },
    })
    .onOk(() => {
      void feeStore.deletePayment(payment).catch(() => undefined);
    });
}

function confirmDeleteRefund(payment: Payment, refund: PaymentRefund) {
  quasar
    .dialog({
      title: t('deleteRefundTitle'),
      message: t('deleteRefundMessage', {
        amount: money(refund.amount, payment.currency),
      }),
      ok: { label: t('delete'), color: 'negative', rounded: true },
      cancel: {
        label: t('finance.action.cancel'),
        color: 'primary',
        flat: true,
        rounded: true,
      },
    })
    .onOk(() => {
      void feeStore.deleteRefund(payment, refund.id).catch(() => undefined);
    });
}

async function copyReference() {
  await copyToClipboard(fee.value.reference);
  quasar.notify({ type: 'positive', message: t('copied') });
}
</script>

<style scoped>
.ledger {
  overflow: hidden;
  border: 1px solid var(--md3-outline-variant);
}

.refund {
  background-color: var(--md3-surface-container-low);
}
</style>

<i18n lang="yaml" locale="en">
actions: 'Actions'
reference: 'Transfer reference'
copied: 'Reference copied'
amountDue: 'Amount due'
noAmountDue: 'None set'
adjusted: 'Set by hand'
noNote: 'No reason given'
cancelled: 'Taken off by cancellations'
status: 'Registration'
registrationStatus:
  ACCEPTED: 'Accepted'
  PENDING: 'Not confirmed yet'
  WAITLISTED: 'On the waiting list'
stillOpen: 'Still open'
overpaid: 'Paid too much'
paid: 'Paid'
ledger: 'Payments'
noPayments: 'No payment recorded yet.'
refund: 'Refund'
refundCancellation: 'Refund · cancellation'
record: 'Record payment'
setAmountDue: 'Set amount due'
refundAction: 'Refund'
deletePayment: 'Delete payment'
deleteRefund: 'Delete refund'
delete: 'Delete'
deletePaymentTitle: 'Delete this payment?'
deletePaymentMessage: 'Only for a payment recorded by mistake: {amount} and its refunds are removed from the ledger. The audit log keeps the entry.'
deleteRefundTitle: 'Delete this refund?'
deleteRefundMessage: 'Only for a refund recorded by mistake: {amount} counts as paid again.'
</i18n>

<i18n lang="yaml" locale="de">
actions: 'Aktionen'
reference: 'Verwendungszweck'
copied: 'Verwendungszweck kopiert'
amountDue: 'Fälliger Betrag'
noAmountDue: 'Keiner festgelegt'
adjusted: 'Von Hand festgelegt'
noNote: 'Ohne Begründung'
cancelled: 'Durch Stornierungen abgezogen'
status: 'Anmeldung'
registrationStatus:
  ACCEPTED: 'Bestätigt'
  PENDING: 'Noch nicht bestätigt'
  WAITLISTED: 'Auf der Warteliste'
stillOpen: 'Noch offen'
overpaid: 'Zu viel bezahlt'
paid: 'Bezahlt'
ledger: 'Zahlungen'
noPayments: 'Noch keine Zahlung erfasst.'
refund: 'Erstattung'
refundCancellation: 'Erstattung · Stornierung'
record: 'Zahlung erfassen'
setAmountDue: 'Betrag festlegen'
refundAction: 'Erstatten'
deletePayment: 'Zahlung löschen'
deleteRefund: 'Erstattung löschen'
delete: 'Löschen'
deletePaymentTitle: 'Diese Zahlung löschen?'
deletePaymentMessage: 'Nur für eine versehentlich erfasste Zahlung: {amount} und ihre Erstattungen werden entfernt. Das Protokoll behält den Eintrag.'
deleteRefundTitle: 'Diese Erstattung löschen?'
deleteRefundMessage: 'Nur für eine versehentlich erfasste Erstattung: {amount} gilt wieder als bezahlt.'
</i18n>

<i18n lang="yaml" locale="fr">
actions: 'Actions'
reference: 'Référence du virement'
copied: 'Référence copiée'
amountDue: 'Montant dû'
noAmountDue: 'Aucun fixé'
adjusted: 'Fixé à la main'
noNote: 'Sans motif'
cancelled: 'Déduit par des annulations'
status: 'Inscription'
registrationStatus:
  ACCEPTED: 'Acceptée'
  PENDING: 'Pas encore confirmée'
  WAITLISTED: "Sur liste d'attente"
stillOpen: 'Reste à payer'
overpaid: 'Trop payé'
paid: 'Payé'
ledger: 'Paiements'
noPayments: 'Aucun paiement enregistré.'
refund: 'Remboursement'
refundCancellation: 'Remboursement · annulation'
record: 'Enregistrer un paiement'
setAmountDue: 'Fixer le montant dû'
refundAction: 'Rembourser'
deletePayment: 'Supprimer le paiement'
deleteRefund: 'Supprimer le remboursement'
delete: 'Supprimer'
deletePaymentTitle: 'Supprimer ce paiement ?'
deletePaymentMessage: "Seulement pour un paiement saisi par erreur : {amount} et ses remboursements sont retirés. Le journal garde l'entrée."
deleteRefundTitle: 'Supprimer ce remboursement ?'
deleteRefundMessage: 'Seulement pour un remboursement saisi par erreur : {amount} compte de nouveau comme payé.'
</i18n>

<i18n lang="yaml" locale="pl">
actions: 'Akcje'
reference: 'Tytuł przelewu'
copied: 'Skopiowano tytuł przelewu'
amountDue: 'Kwota należna'
noAmountDue: 'Nie ustalono'
adjusted: 'Ustalono ręcznie'
noNote: 'Bez powodu'
cancelled: 'Odjęto przez rezygnacje'
status: 'Zgłoszenie'
registrationStatus:
  ACCEPTED: 'Przyjęte'
  PENDING: 'Jeszcze niepotwierdzone'
  WAITLISTED: 'Na liście oczekujących'
stillOpen: 'Pozostało do zapłaty'
overpaid: 'Nadpłata'
paid: 'Zapłacone'
ledger: 'Płatności'
noPayments: 'Nie zarejestrowano jeszcze płatności.'
refund: 'Zwrot'
refundCancellation: 'Zwrot · rezygnacja'
record: 'Zarejestruj płatność'
setAmountDue: 'Ustal kwotę należną'
refundAction: 'Zwróć'
deletePayment: 'Usuń płatność'
deleteRefund: 'Usuń zwrot'
delete: 'Usuń'
deletePaymentTitle: 'Usunąć tę płatność?'
deletePaymentMessage: 'Tylko dla płatności zapisanej przez pomyłkę: {amount} i jej zwroty zostaną usunięte. Dziennik zachowa wpis.'
deleteRefundTitle: 'Usunąć ten zwrot?'
deleteRefundMessage: 'Tylko dla zwrotu zapisanego przez pomyłkę: {amount} znów liczy się jako zapłacone.'
</i18n>

<i18n lang="yaml" locale="cs">
actions: 'Akce'
reference: 'Reference platby'
copied: 'Reference zkopírována'
amountDue: 'Dlužná částka'
noAmountDue: 'Nestanovena'
adjusted: 'Stanoveno ručně'
noNote: 'Bez důvodu'
cancelled: 'Odečteno stornem'
status: 'Registrace'
registrationStatus:
  ACCEPTED: 'Přijata'
  PENDING: 'Zatím nepotvrzena'
  WAITLISTED: 'Na čekací listině'
stillOpen: 'Zbývá zaplatit'
overpaid: 'Přeplaceno'
paid: 'Zaplaceno'
ledger: 'Platby'
noPayments: 'Zatím žádná platba.'
refund: 'Vrácení'
refundCancellation: 'Vrácení · storno'
record: 'Zaznamenat platbu'
setAmountDue: 'Stanovit dlužnou částku'
refundAction: 'Vrátit'
deletePayment: 'Smazat platbu'
deleteRefund: 'Smazat vrácení'
delete: 'Smazat'
deletePaymentTitle: 'Smazat tuto platbu?'
deletePaymentMessage: 'Jen pro platbu zadanou omylem: {amount} a její vrácení budou odstraněny. Protokol záznam zachová.'
deleteRefundTitle: 'Smazat toto vrácení?'
deleteRefundMessage: 'Jen pro vrácení zadané omylem: {amount} se opět počítá jako zaplacené.'
</i18n>
