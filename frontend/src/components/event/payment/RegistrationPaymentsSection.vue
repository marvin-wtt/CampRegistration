<template>
  <div data-test="registration-payments">
    <q-list class="segmented-list">
      <payment-balance-item
        :payment="balance"
        :answers-amount="answersAmount"
        :can-adjust="can('event.payments.adjust')"
        :can-refund-overpaid="!!overpaymentSource"
        :actions="balanceActions"
        @refund-overpaid="overpaymentSource && refund(overpaymentSource)"
        @adjust="adjust"
      />

      <q-item
        v-if="paymentStore.isLoading && payments.length === 0"
        class="segment"
      >
        <q-item-section avatar>
          <q-skeleton
            type="QAvatar"
            size="40px"
          />
        </q-item-section>
        <q-item-section>
          <q-skeleton
            type="text"
            width="40%"
          />
          <q-skeleton
            type="text"
            width="60%"
          />
        </q-item-section>
      </q-item>

      <payment-ledger-item
        v-for="entry in payments"
        :key="entry.id"
        :payment="entry"
        :can-refund="canRefund(entry)"
        :can-delete="canDelete(entry)"
        @refund="refund(entry)"
        @remove="remove(entry)"
      />

      <q-item
        v-if="can('event.payments.create')"
        class="segment"
        clickable
        data-test="payment-record"
        @click="record"
      >
        <q-item-section avatar>
          <div class="row-icon row-icon--action">
            <q-icon
              name="add"
              size="20px"
            />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="row-value row-value--link">
            {{ t('action.record') }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { copyToClipboard, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type {
  AmountDueUpdateData,
  Payment,
  PaymentCreateData,
  PaymentRefundCreateData,
  Registration,
  RegistrationPaymentDetails,
} from '@camp-registration/common/entities';
import { refundableAmount } from '@camp-registration/common/utils';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { usePaymentStore } from '@/stores/payment-store';
import { usePermissions } from '@/composables/permissions';
import { useErrorExtractor } from '@/composables/serviceHandler';
import { quoteRegistration } from '@/lib/surveyJs/quote';
import PaymentBalanceItem from '@/components/event/payment/PaymentBalanceItem.vue';
import type { BalanceAction } from '@/components/event/payment/types';
import PaymentLedgerItem from '@/components/event/payment/PaymentLedgerItem.vue';
import RecordPaymentDialog from '@/components/event/payment/RecordPaymentDialog.vue';
import AdjustAmountDueDialog from '@/components/event/payment/AdjustAmountDueDialog.vue';
import RefundPaymentDialog from '@/components/event/payment/RefundPaymentDialog.vue';

// `balance` is the registration's own, passed in non-null: the section is
// only shown to whoever may see payment data.
const { eventId, registration, balance } = defineProps<{
  eventId: string;
  registration: Registration;
  balance: RegistrationPaymentDetails;
}>();

const { t } = useI18n();
const quasar = useQuasar();
const { can } = usePermissions();
const { extractErrorText } = useErrorExtractor();
const eventDetailsStore = useEventDetailsStore();
const paymentStore = usePaymentStore();

void paymentStore.fetchData(eventId);
watch(
  () => eventId,
  (id) => void paymentStore.fetchData(id),
);

const payments = computed<Payment[]>(() =>
  paymentStore
    .forRegistration(registration.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
);

function canRefund(payment: Payment): boolean {
  return can('event.payments.refund') && refundableAmount(payment) > 0;
}

function canDelete(payment: Payment): boolean {
  return (
    can('event.payments.create') &&
    payment.source === 'manual' &&
    payment.refunds.length === 0
  );
}

// The payment to give the excess back from: the latest one that can return
// all of it, else the latest that can return anything.
const overpaymentSource = computed<Payment | null>(() => {
  const { overpaid } = balance;
  if (overpaid <= 0) {
    return null;
  }
  const candidates = payments.value
    .filter(canRefund)
    .sort((a, b) =>
      (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt),
    );

  return (
    candidates.find((entry) => refundableAmount(entry) >= overpaid) ??
    candidates[0] ??
    null
  );
});

// What the answers come to today, when that differs from what is owed and
// no manager has set the amount: edits never re-price on their own.
const answersAmount = computed<number | null>(() => {
  const event = eventDetailsStore.data;
  if (!event || balance.adjustment || balance.amountDue === null) {
    return null;
  }

  const amount = quoteRegistration(event, registration);
  return amount === balance.amountDue ? null : amount;
});

async function run(action: () => Promise<unknown>, success: string) {
  try {
    await action();
    quasar.notify({ type: 'positive', message: success });
  } catch (err) {
    quasar.notify({ type: 'negative', message: extractErrorText(err) });
  }
}

// What concerns the balance sits in its tile's menu; recording a payment is
// the list's own last row.
const balanceActions = computed<BalanceAction[]>(() => {
  const actions: (BalanceAction & { shown: boolean })[] = [
    {
      key: 'adjust',
      icon: 'edit',
      label: t('action.adjust'),
      shown: can('event.payments.adjust'),
      run: () => adjust(),
    },
    {
      key: 'request',
      icon: 'forward_to_inbox',
      label: t('action.request'),
      shown:
        can('event.payments.create') &&
        registration.status === 'ACCEPTED' &&
        balance.outstanding > 0,
      run: () =>
        void run(
          () => paymentStore.request(eventId, registration.id),
          t('notify.requested'),
        ),
    },
    {
      key: 'copy-link',
      icon: 'link',
      label: t('action.copyLink'),
      shown: !!balance.amountDue,
      run: () => void copyLink(),
    },
  ];

  return actions.filter((action) => action.shown);
});

function record(): void {
  quasar
    .dialog({
      component: RecordPaymentDialog,
      componentProps: {
        currency: balance.currency,
        outstanding: balance.outstanding,
        amountDue: balance.amountDue,
      },
    })
    .onOk((data: PaymentCreateData) => {
      void run(
        () => paymentStore.record(eventId, registration.id, data),
        t('notify.recorded'),
      );
    });
}

function adjust(suggestedAmount: number | null = null): void {
  quasar
    .dialog({
      component: AdjustAmountDueDialog,
      componentProps: {
        currency: balance.currency,
        amountDue: balance.amountDue,
        quotedAmount: balance.quotedAmount,
        suggestedAmount,
        note: balance.adjustment?.note ?? null,
        adjusted: balance.adjustment !== null,
      },
    })
    .onOk((data: AmountDueUpdateData) => {
      void run(
        () => paymentStore.adjustAmountDue(eventId, registration.id, data),
        t('notify.adjusted'),
      );
    });
}

function refund(payment: Payment): void {
  quasar
    .dialog({
      component: RefundPaymentDialog,
      componentProps: {
        currency: payment.currency,
        refundable: refundableAmount(payment),
        overpaid: balance.overpaid,
        manual: payment.source === 'manual',
      },
    })
    .onOk((data: PaymentRefundCreateData) => {
      void run(
        () => paymentStore.refund(eventId, registration.id, payment.id, data),
        t('notify.refunded'),
      );
    });
}

function remove(payment: Payment): void {
  quasar
    .dialog({
      title: t('delete.title'),
      message: t('delete.message'),
      cancel: { flat: true, rounded: true, color: 'primary' },
      ok: {
        label: t('action.delete'),
        color: 'negative',
        flat: true,
        rounded: true,
      },
    })
    .onOk(() => {
      void run(
        () => paymentStore.remove(eventId, registration.id, payment.id),
        t('notify.deleted'),
      );
    });
}

async function copyLink(): Promise<void> {
  try {
    const pageUrl = await paymentStore.fetchPageUrl(eventId, registration.id);
    if (!pageUrl) {
      return;
    }
    await copyToClipboard(pageUrl);
    quasar.notify({ type: 'positive', message: t('notify.copied') });
  } catch (err) {
    quasar.notify({ type: 'negative', message: extractErrorText(err) });
  }
}
</script>

<i18n lang="yaml" locale="en">
action:
  record: 'Record payment'
  request: 'Send payment request'
  copyLink: 'Copy payment link'
  adjust: 'Change amount'
  delete: 'Delete'
delete:
  title: 'Delete payment?'
  message: 'Only delete a payment that was recorded by mistake.'
notify:
  recorded: 'Payment recorded'
  refunded: 'Refund issued'
  deleted: 'Payment deleted'
  requested: 'Payment request sent'
  copied: 'Payment link copied'
  adjusted: 'Amount due updated'
</i18n>

<i18n lang="yaml" locale="de">
action:
  record: 'Zahlung erfassen'
  request: 'Zahlungsaufforderung senden'
  copyLink: 'Zahlungslink kopieren'
  adjust: 'Betrag ändern'
  delete: 'Löschen'
delete:
  title: 'Zahlung löschen?'
  message: 'Lösche nur eine Zahlung, die versehentlich erfasst wurde.'
notify:
  recorded: 'Zahlung erfasst'
  refunded: 'Erstattung veranlasst'
  deleted: 'Zahlung gelöscht'
  requested: 'Zahlungsaufforderung gesendet'
  copied: 'Zahlungslink kopiert'
  adjusted: 'Fälliger Betrag aktualisiert'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  record: 'Enregistrer un paiement'
  request: 'Envoyer une demande de paiement'
  copyLink: 'Copier le lien de paiement'
  adjust: 'Modifier le montant'
  delete: 'Supprimer'
delete:
  title: 'Supprimer le paiement ?'
  message: "Ne supprimez qu'un paiement enregistré par erreur."
notify:
  recorded: 'Paiement enregistré'
  refunded: 'Remboursement effectué'
  deleted: 'Paiement supprimé'
  requested: 'Demande de paiement envoyée'
  copied: 'Lien de paiement copié'
  adjusted: 'Montant dû mis à jour'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  record: 'Zarejestruj płatność'
  request: 'Wyślij prośbę o płatność'
  copyLink: 'Kopiuj link do płatności'
  adjust: 'Zmień kwotę'
  delete: 'Usuń'
delete:
  title: 'Usunąć płatność?'
  message: 'Usuwaj tylko płatność zarejestrowaną przez pomyłkę.'
notify:
  recorded: 'Płatność zarejestrowana'
  refunded: 'Zwrot zlecony'
  deleted: 'Płatność usunięta'
  requested: 'Prośba o płatność wysłana'
  copied: 'Link do płatności skopiowany'
  adjusted: 'Zaktualizowano kwotę do zapłaty'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  record: 'Zaznamenat platbu'
  request: 'Poslat výzvu k platbě'
  copyLink: 'Kopírovat odkaz na platbu'
  adjust: 'Změnit částku'
  delete: 'Smazat'
delete:
  title: 'Smazat platbu?'
  message: 'Mažte pouze platbu zaznamenanou omylem.'
notify:
  recorded: 'Platba zaznamenána'
  refunded: 'Vrácení zadáno'
  deleted: 'Platba smazána'
  requested: 'Výzva k platbě odeslána'
  copied: 'Odkaz na platbu zkopírován'
  adjusted: 'Dlužná částka aktualizována'
</i18n>

<style scoped lang="scss">
@use '../../../css/segmented-list';

.row-icon--action {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}
</style>
