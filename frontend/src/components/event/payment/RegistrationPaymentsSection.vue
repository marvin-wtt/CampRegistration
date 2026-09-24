<template>
  <q-list data-test="registration-payments">
    <q-item-label
      header
      class="row items-center no-wrap"
    >
      <span class="col">{{ t('title') }}</span>
      <payment-status-chip :status="registration.payment.status" />
    </q-item-label>

    <q-item v-if="registration.payment.amountDue !== null">
      <q-item-section
        avatar
        top
      >
        <q-icon
          color="primary"
          name="payments"
        />
      </q-item-section>
      <q-item-section>
        <q-item-label overline>{{ t('balance') }}</q-item-label>
        <q-item-label>
          {{ money(registration.payment.amountPaid) }} /
          {{ money(registration.payment.amountDue) }}
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item v-if="loading">
      <q-item-section>
        <q-skeleton type="text" />
        <q-skeleton
          type="text"
          width="60%"
        />
      </q-item-section>
    </q-item>

    <q-item
      v-for="payment in payments"
      :key="payment.id"
      :data-test="`payment-${payment.id}`"
    >
      <q-item-section
        avatar
        top
      >
        <q-icon
          :name="payment.source === 'manual' ? 'edit_note' : 'credit_card'"
          :color="payment.status === 'PAID' ? 'positive' : 'grey-6'"
        />
      </q-item-section>
      <q-item-section>
        <q-item-label>
          {{ money(payment.amount, payment.currency) }}
          <span class="text-on-surface-variant">
            · {{ t(`status.${payment.status}`) }}
          </span>
        </q-item-label>
        <q-item-label caption>
          {{ describePayment(payment) }}
        </q-item-label>
        <q-item-label
          v-if="payment.note"
          caption
        >
          {{ payment.note }}
        </q-item-label>
        <q-item-label
          v-for="refund in payment.refunds"
          :key="refund.id"
          caption
          class="row items-center no-wrap q-gutter-x-xs"
        >
          <q-icon
            name="undo"
            size="14px"
          />
          <span>
            {{
              t('refund.line', {
                amount: money(refund.amount, payment.currency),
                status: t(`refundStatus.${refund.status}`),
              })
            }}
            <template v-if="refund.createdBy">
              · {{ refund.createdBy }}</template
            >
            <template v-if="refund.reason"> · {{ refund.reason }}</template>
          </span>
        </q-item-label>
      </q-item-section>
      <q-item-section
        v-if="canRefund(payment) || canDelete(payment)"
        side
        top
      >
        <q-btn
          flat
          round
          dense
          icon="more_vert"
          :aria-label="t('action.menu')"
        >
          <q-menu>
            <q-list dense>
              <q-item
                v-if="canRefund(payment)"
                v-close-popup
                clickable
                data-test="payment-refund"
                @click="refund(payment)"
              >
                <q-item-section avatar>
                  <q-icon name="undo" />
                </q-item-section>
                <q-item-section>{{ t('action.refund') }}</q-item-section>
              </q-item>
              <q-item
                v-if="canDelete(payment)"
                v-close-popup
                clickable
                @click="remove(payment)"
              >
                <q-item-section avatar>
                  <q-icon name="delete" />
                </q-item-section>
                <q-item-section>{{ t('action.delete') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-item-section>
    </q-item>

    <q-item v-if="can('event.payments.create')">
      <q-item-section>
        <div class="row q-gutter-sm">
          <m-btn
            outline
            primary
            size="sm"
            icon="add"
            :label="t('action.record')"
            data-test="payment-record"
            @click="record"
          />
          <m-btn
            v-if="registration.payment.amountDue && outstanding > 0"
            outline
            primary
            size="sm"
            icon="forward_to_inbox"
            :label="t('action.request')"
            :loading="requesting"
            @click="request"
          />
          <m-btn
            v-if="pageUrl"
            text
            primary
            size="sm"
            icon="link"
            :label="t('action.copyLink')"
            @click="copyLink"
          />
        </div>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { copyToClipboard, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type {
  Payment,
  PaymentCreateData,
  PaymentRefundCreateData,
  Registration,
} from '@camp-registration/common/entities';
import { formatMoney } from '@camp-registration/common/utils';
import { useAPIService } from '@/services/APIService';
import { usePermissions } from '@/composables/permissions';
import { useErrorExtractor } from '@/composables/serviceHandler';
import { useRealtimeStore } from '@/stores/realtime-store';
import { useRegistrationsStore } from '@/stores/registration-store';
import PaymentStatusChip from '@/components/event/payment/PaymentStatusChip.vue';
import RecordPaymentDialog from '@/components/event/payment/RecordPaymentDialog.vue';
import RefundPaymentDialog from '@/components/event/payment/RefundPaymentDialog.vue';

const { eventId, registration } = defineProps<{
  eventId: string;
  registration: Registration;
}>();

const { t, locale } = useI18n();
const quasar = useQuasar();
const api = useAPIService();
const { can } = usePermissions();
const { extractErrorText } = useErrorExtractor();
const registrationsStore = useRegistrationsStore();
const realtime = useRealtimeStore();

const payments = ref<Payment[]>([]);
const pageUrl = ref<string | null>(null);
const loading = ref<boolean>(false);
const requesting = ref<boolean>(false);

const outstanding = computed<number>(() =>
  Math.max(
    0,
    (registration.payment.amountDue ?? 0) - registration.payment.amountPaid,
  ),
);

function money(minor: number, currency = registration.payment.currency) {
  return formatMoney(minor, currency, locale.value);
}

function describePayment(payment: Payment): string {
  const parts = [t(`source.${payment.source}`)];
  if (payment.method && payment.source === 'manual') {
    parts.push(t(`method.${payment.method}`));
  }
  const date = payment.paidAt ?? payment.createdAt;
  parts.push(new Date(date).toLocaleDateString(locale.value));
  if (payment.createdBy) {
    parts.push(payment.createdBy);
  }

  return parts.join(' · ');
}

function refundable(payment: Payment): number {
  return payment.status === 'PAID'
    ? payment.amount - payment.amountRefunded
    : 0;
}

function canRefund(payment: Payment): boolean {
  return can('event.payments.refund') && refundable(payment) > 0;
}

function canDelete(payment: Payment): boolean {
  return (
    can('event.payments.create') &&
    payment.source === 'manual' &&
    payment.refunds.length === 0
  );
}

async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await api.fetchRegistrationPayments(
      eventId,
      registration.id,
    );
    payments.value = result.payments;
    pageUrl.value = result.pageUrl;
  } catch (err) {
    quasar.notify({ type: 'negative', message: extractErrorText(err) });
  } finally {
    loading.value = false;
  }
}

async function reload(): Promise<void> {
  await Promise.all([load(), registrationsStore.refreshOne(registration.id)]);
}

onMounted(load);
watch(() => registration.id, load);

// Another client (or a provider webhook) changed a payment of this event.
const unsubscribe = realtime.on('payment', () => {
  void load();
});
onBeforeUnmount(unsubscribe);

async function run(action: () => Promise<unknown>, success: string) {
  try {
    await action();
    quasar.notify({ type: 'positive', message: success });
  } catch (err) {
    quasar.notify({ type: 'negative', message: extractErrorText(err) });
  } finally {
    await reload();
  }
}

function record(): void {
  quasar
    .dialog({
      component: RecordPaymentDialog,
      componentProps: {
        currency: registration.payment.currency,
        outstanding: outstanding.value,
      },
    })
    .onOk((data: PaymentCreateData) => {
      void run(
        () => api.createManualPayment(eventId, registration.id, data),
        t('notify.recorded'),
      );
    });
}

function refund(payment: Payment): void {
  quasar
    .dialog({
      component: RefundPaymentDialog,
      componentProps: {
        currency: payment.currency,
        refundable: refundable(payment),
        manual: payment.source === 'manual',
      },
    })
    .onOk((data: PaymentRefundCreateData) => {
      void run(
        () => api.refundPayment(eventId, registration.id, payment.id, data),
        t('notify.refunded'),
      );
    });
}

function remove(payment: Payment): void {
  quasar
    .dialog({
      title: t('delete.title'),
      message: t('delete.message'),
      cancel: true,
      ok: { label: t('action.delete'), color: 'negative', flat: true },
    })
    .onOk(() => {
      void run(
        () => api.deletePayment(eventId, registration.id, payment.id),
        t('notify.deleted'),
      );
    });
}

async function request(): Promise<void> {
  requesting.value = true;
  try {
    await api.requestPayment(eventId, registration.id);
    quasar.notify({ type: 'positive', message: t('notify.requested') });
  } catch (err) {
    quasar.notify({ type: 'negative', message: extractErrorText(err) });
  } finally {
    requesting.value = false;
  }
}

async function copyLink(): Promise<void> {
  if (!pageUrl.value) {
    return;
  }

  await copyToClipboard(pageUrl.value);
  quasar.notify({ type: 'positive', message: t('notify.copied') });
}
</script>

<i18n lang="yaml" locale="en">
title: 'Payments'
balance: 'Paid / due'
status:
  OPEN: 'Checkout open'
  PENDING: 'Processing'
  PAID: 'Paid'
  FAILED: 'Failed'
  CANCELED: 'Canceled'
  EXPIRED: 'Expired'
refundStatus:
  PENDING: 'pending'
  REFUNDED: 'refunded'
  FAILED: 'failed'
  CANCELED: 'canceled'
refund:
  line: '{amount} refund {status}'
source:
  manual: 'Recorded manually'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Fake provider'
method:
  bank_transfer: 'Bank transfer'
  cash: 'Cash'
  other: 'Other'
action:
  menu: 'Payment actions'
  record: 'Record payment'
  request: 'Send payment request'
  copyLink: 'Copy payment link'
  refund: 'Refund'
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
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zahlungen'
balance: 'Bezahlt / fällig'
status:
  OPEN: 'Zahlung offen'
  PENDING: 'In Bearbeitung'
  PAID: 'Bezahlt'
  FAILED: 'Fehlgeschlagen'
  CANCELED: 'Abgebrochen'
  EXPIRED: 'Abgelaufen'
refundStatus:
  PENDING: 'ausstehend'
  REFUNDED: 'erstattet'
  FAILED: 'fehlgeschlagen'
  CANCELED: 'abgebrochen'
refund:
  line: 'Erstattung {amount} {status}'
source:
  manual: 'Manuell erfasst'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Test-Anbieter'
method:
  bank_transfer: 'Überweisung'
  cash: 'Bar'
  other: 'Sonstige'
action:
  menu: 'Zahlungsaktionen'
  record: 'Zahlung erfassen'
  request: 'Zahlungsaufforderung senden'
  copyLink: 'Zahlungslink kopieren'
  refund: 'Erstatten'
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
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Paiements'
balance: 'Payé / dû'
status:
  OPEN: 'Paiement ouvert'
  PENDING: 'En cours'
  PAID: 'Payé'
  FAILED: 'Échoué'
  CANCELED: 'Annulé'
  EXPIRED: 'Expiré'
refundStatus:
  PENDING: 'en attente'
  REFUNDED: 'remboursé'
  FAILED: 'échoué'
  CANCELED: 'annulé'
refund:
  line: 'Remboursement de {amount} {status}'
source:
  manual: 'Enregistré manuellement'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Prestataire de test'
method:
  bank_transfer: 'Virement bancaire'
  cash: 'Espèces'
  other: 'Autre'
action:
  menu: 'Actions de paiement'
  record: 'Enregistrer un paiement'
  request: 'Envoyer une demande de paiement'
  copyLink: 'Copier le lien de paiement'
  refund: 'Rembourser'
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
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Płatności'
balance: 'Zapłacono / należne'
status:
  OPEN: 'Płatność otwarta'
  PENDING: 'W toku'
  PAID: 'Opłacone'
  FAILED: 'Nieudane'
  CANCELED: 'Anulowane'
  EXPIRED: 'Wygasłe'
refundStatus:
  PENDING: 'oczekuje'
  REFUNDED: 'zwrócono'
  FAILED: 'nieudany'
  CANCELED: 'anulowany'
refund:
  line: 'Zwrot {amount} {status}'
source:
  manual: 'Zarejestrowano ręcznie'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Operator testowy'
method:
  bank_transfer: 'Przelew bankowy'
  cash: 'Gotówka'
  other: 'Inna'
action:
  menu: 'Akcje płatności'
  record: 'Zarejestruj płatność'
  request: 'Wyślij prośbę o płatność'
  copyLink: 'Kopiuj link do płatności'
  refund: 'Zwróć'
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
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Platby'
balance: 'Zaplaceno / splatné'
status:
  OPEN: 'Platba otevřená'
  PENDING: 'Zpracovává se'
  PAID: 'Zaplaceno'
  FAILED: 'Neúspěšná'
  CANCELED: 'Zrušená'
  EXPIRED: 'Vypršela'
refundStatus:
  PENDING: 'čeká'
  REFUNDED: 'vráceno'
  FAILED: 'neúspěšné'
  CANCELED: 'zrušeno'
refund:
  line: 'Vrácení {amount} {status}'
source:
  manual: 'Zaznamenáno ručně'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Testovací poskytovatel'
method:
  bank_transfer: 'Bankovní převod'
  cash: 'Hotovost'
  other: 'Jiné'
action:
  menu: 'Akce platby'
  record: 'Zaznamenat platbu'
  request: 'Poslat výzvu k platbě'
  copyLink: 'Kopírovat odkaz na platbu'
  refund: 'Vrátit'
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
</i18n>
