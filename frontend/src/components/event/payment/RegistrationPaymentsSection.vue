<template>
  <div data-test="registration-payments">
    <q-list class="segmented-list">
      <q-item
        class="segment"
        data-test="payment-balance"
      >
        <q-item-section avatar>
          <div class="row-icon">
            <q-icon
              name="payments"
              size="20px"
            />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="row-label">
            {{ payment.amountDue === null ? t('paid') : t('due') }}
          </q-item-label>
          <q-item-label class="row-value balance-value">
            {{ money(payment.amountDue ?? payment.amountPaid) }}
          </q-item-label>
          <!-- Paid and open as labelled amounts, never "x of y". -->
          <template v-if="payment.amountDue">
            <q-linear-progress
              :value="paidShare"
              color="primary"
              track-color="surface-container-highest"
              size="6px"
              rounded
              class="q-mt-sm"
              :aria-label="t('paidShare')"
            />
            <div
              class="balance-figures row justify-between no-wrap q-mt-xs"
              data-test="payment-figures"
            >
              <span>
                {{ t('paid') }}
                <strong>{{ money(payment.amountPaid) }}</strong>
              </span>
              <span
                v-if="payment.overpaid > 0"
                class="balance-figures__overpaid"
              >
                {{ t('overpaid') }}
                <strong>{{ money(payment.overpaid) }}</strong>
              </span>
              <span v-else-if="outstanding > 0">
                {{ t('open') }}
                <strong>{{ money(outstanding) }}</strong>
              </span>
            </div>
          </template>
          <q-item-label
            v-if="payment.overpaid > 0"
            class="row-caption row-caption--warning"
            data-test="payment-overpaid"
          >
            {{ t('overpaidHint') }}
            <a
              v-if="overpaymentSource"
              class="inline-action"
              href="#"
              data-test="payment-refund-overpaid"
              @click.prevent="refund(overpaymentSource)"
            >
              {{ t('action.refund') }}
            </a>
          </q-item-label>
          <q-item-label
            v-if="payment.adjustment"
            class="row-caption"
            data-test="payment-adjustment"
          >
            {{ t('adjusted') }}
            <template v-if="payment.adjustment.note">
              · {{ payment.adjustment.note }}
            </template>
            <template v-if="payment.quotedAmount !== null">
              · {{ t('quoted', { amount: money(payment.quotedAmount) }) }}
            </template>
          </q-item-label>
          <q-item-label
            v-if="answersAmount !== null"
            class="row-caption row-caption--warning"
            data-test="payment-answers-differ"
          >
            {{ t('answersDiffer', { amount: money(answersAmount) }) }}
            <a
              v-if="can('event.payments.adjust')"
              class="inline-action"
              href="#"
              data-test="payment-adjust-to-answers"
              @click.prevent="adjust(answersAmount)"
            >
              {{ t('action.adjust') }}
            </a>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row items-center no-wrap q-gutter-x-xs">
            <payment-status-chip :status="payment.status" />
            <q-btn
              v-if="menuActions.length > 0"
              class="row-action"
              flat
              round
              size="sm"
              icon="more_vert"
              :aria-label="t('action.more')"
              data-test="payment-menu"
            >
              <q-menu>
                <q-list style="min-width: 220px">
                  <q-item
                    v-for="action in menuActions"
                    :key="action.key"
                    v-close-popup
                    clickable
                    :data-test="`payment-${action.key}`"
                    @click="action.run"
                  >
                    <q-item-section avatar>
                      <q-icon :name="action.icon" />
                    </q-item-section>
                    <q-item-section>{{ action.label }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>

      <q-item
        v-if="loading && payments.length === 0"
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

      <q-item
        v-for="entry in payments"
        :key="entry.id"
        class="segment"
        :data-test="`payment-${entry.id}`"
      >
        <q-item-section avatar>
          <div
            class="row-icon"
            :class="{ 'row-icon--muted': entry.status !== 'PAID' }"
          >
            <q-icon
              :name="paymentIcon(entry)"
              size="20px"
            />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="row-label">
            {{ describePayment(entry) }}
          </q-item-label>
          <q-item-label class="row-value">
            {{ money(entry.amount, entry.currency) }}
            <span
              v-if="entry.status !== 'PAID'"
              class="row-value--muted"
            >
              · {{ t(`status.${entry.status}`) }}
            </span>
          </q-item-label>
          <q-item-label
            v-if="entry.note"
            class="row-caption"
          >
            {{ entry.note }}
          </q-item-label>
          <q-item-label
            v-for="refund in entry.refunds"
            :key="refund.id"
            class="row-caption row items-center no-wrap"
          >
            <q-icon
              name="undo"
              size="14px"
              class="q-mr-xs"
            />
            <span>
              {{
                t('refund.line', {
                  amount: money(refund.amount, entry.currency),
                  status: t(`refundStatus.${refund.status}`),
                })
              }}
              <template v-if="refund.reason"> · {{ refund.reason }}</template>
            </span>
          </q-item-label>
        </q-item-section>
        <q-item-section
          v-if="canRefund(entry) || canDelete(entry)"
          side
        >
          <q-btn
            class="row-action"
            flat
            round
            size="sm"
            icon="more_vert"
            :aria-label="t('action.menu')"
          >
            <q-menu>
              <q-list style="min-width: 180px">
                <q-item
                  v-if="canRefund(entry)"
                  v-close-popup
                  clickable
                  data-test="payment-refund"
                  @click="refund(entry)"
                >
                  <q-item-section avatar>
                    <q-icon name="undo" />
                  </q-item-section>
                  <q-item-section>{{ t('action.refund') }}</q-item-section>
                </q-item>
                <q-item
                  v-if="canDelete(entry)"
                  v-close-popup
                  clickable
                  @click="remove(entry)"
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { copyToClipboard, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type {
  AmountDueUpdateData,
  Payment,
  PaymentCreateData,
  PaymentRefundCreateData,
  Registration,
} from '@camp-registration/common/entities';
import { SurveyModel } from 'survey-core';
import { computeAmountDue, formatMoney } from '@camp-registration/common/utils';
import {
  extractPaymentAmounts,
  setVariables,
} from '@camp-registration/common/form';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useAPIService } from '@/services/APIService';
import { usePermissions } from '@/composables/permissions';
import { useErrorExtractor } from '@/composables/serviceHandler';
import { useRealtimeStore } from '@/stores/realtime-store';
import { useRegistrationsStore } from '@/stores/registration-store';
import PaymentStatusChip from '@/components/event/payment/PaymentStatusChip.vue';
import RecordPaymentDialog from '@/components/event/payment/RecordPaymentDialog.vue';
import AdjustAmountDueDialog from '@/components/event/payment/AdjustAmountDueDialog.vue';
import RefundPaymentDialog from '@/components/event/payment/RefundPaymentDialog.vue';

const { eventId, registration } = defineProps<{
  eventId: string;
  registration: Registration;
}>();

const { t, d, locale } = useI18n();
const quasar = useQuasar();
const api = useAPIService();
const { can } = usePermissions();
const { extractErrorText } = useErrorExtractor();
const registrationsStore = useRegistrationsStore();
const eventDetailsStore = useEventDetailsStore();
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

const paidShare = computed<number>(() => {
  const due = payment.value.amountDue ?? 0;
  return due > 0 ? Math.min(1, payment.value.amountPaid / due) : 0;
});

// The payment to give the excess back from: the latest one that can return
// all of it, else the latest that can return anything.
const overpaymentSource = computed<Payment | null>(() => {
  if (payment.value.overpaid <= 0) {
    return null;
  }
  const candidates = payments.value
    .filter(canRefund)
    .sort((a, b) =>
      (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt),
    );

  return (
    candidates.find((entry) => refundable(entry) >= payment.value.overpaid) ??
    candidates[0] ??
    null
  );
});

function money(minor: number, currency = registration.payment.currency) {
  return formatMoney(minor, currency, locale.value);
}

const payment = computed(() => registration.payment);

function paymentIcon(entry: Payment): string {
  if (entry.source !== 'manual') {
    return 'credit_card';
  }
  switch (entry.method) {
    case 'bank_transfer':
      return 'account_balance';
    case 'cash':
      return 'payments';
    default:
      return 'edit_note';
  }
}

function describePayment(payment: Payment): string {
  const parts = [
    payment.source === 'manual' && payment.method
      ? t(`method.${payment.method}`)
      : t(`source.${payment.source}`),
  ];
  parts.push(d(payment.paidAt ?? payment.createdAt, 'date'));
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

// What concerns the balance sits in its tile's menu; recording a payment is
// the list's own last row.
const menuActions = computed(() =>
  [
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
        !!registration.payment.amountDue &&
        outstanding.value > 0,
      run: () => void request(),
    },
    {
      key: 'copy-link',
      icon: 'link',
      label: t('action.copyLink'),
      shown: !!pageUrl.value,
      run: () => void copyLink(),
    },
  ].filter((action) => action.shown),
);

function record(): void {
  quasar
    .dialog({
      component: RecordPaymentDialog,
      componentProps: {
        currency: registration.payment.currency,
        outstanding: outstanding.value,
        amountDue: registration.payment.amountDue,
      },
    })
    .onOk((data: PaymentCreateData) => {
      void run(
        () => api.createManualPayment(eventId, registration.id, data),
        t('notify.recorded'),
      );
    });
}

// What the answers come to today, when that differs from what is owed and
// no manager has set the amount: edits never re-price on their own.
const answersAmount = computed<number | null>(() => {
  const event = eventDetailsStore.data;
  const { payment } = registration;
  if (!event || payment.adjustment || payment.amountDue === null) {
    return null;
  }

  const survey = new SurveyModel(event.form);
  survey.locale = registration.locale;
  setVariables(survey, event, { group: registration.group });
  survey.data = registration.data;
  const amount = computeAmountDue(event, extractPaymentAmounts(survey));

  return amount === payment.amountDue ? null : amount;
});

function adjust(suggestedAmount: number | null = null): void {
  const { payment } = registration;
  quasar
    .dialog({
      component: AdjustAmountDueDialog,
      componentProps: {
        currency: payment.currency,
        amountDue: payment.amountDue,
        quotedAmount: payment.quotedAmount,
        suggestedAmount,
        note: payment.adjustment?.note ?? null,
        adjusted: payment.adjustment !== null,
      },
    })
    .onOk((data: AmountDueUpdateData) => {
      void run(
        () => api.updateAmountDue(eventId, registration.id, data),
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
        refundable: refundable(payment),
        overpaid: registration.payment.overpaid,
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
balance: 'Paid / due'
open: 'Open'
due: 'Due'
paid: 'Paid'
overpaid: 'Overpaid'
overpaidHint: 'More arrived than is due.'
paidShare: 'Share paid'
adjusted: 'Set by hand'
quoted: 'Shown at registration: {amount}'
answersDiffer: 'The answers now come to {amount}.'
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
  more: 'More payment actions'
  record: 'Record payment'
  request: 'Send payment request'
  copyLink: 'Copy payment link'
  adjust: 'Change amount'
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
  adjusted: 'Amount due updated'
</i18n>

<i18n lang="yaml" locale="de">
balance: 'Bezahlt / fällig'
open: 'Offen'
due: 'Fällig'
paid: 'Bezahlt'
overpaid: 'Überzahlt'
overpaidHint: 'Es ist mehr eingegangen als fällig.'
paidShare: 'Bezahlter Anteil'
adjusted: 'Von Hand festgelegt'
quoted: 'Bei der Anmeldung angezeigt: {amount}'
answersDiffer: 'Die Antworten ergeben jetzt {amount}.'
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
  more: 'Weitere Zahlungsaktionen'
  record: 'Zahlung erfassen'
  request: 'Zahlungsaufforderung senden'
  copyLink: 'Zahlungslink kopieren'
  adjust: 'Betrag ändern'
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
  adjusted: 'Fälliger Betrag aktualisiert'
</i18n>

<i18n lang="yaml" locale="fr">
balance: 'Payé / dû'
open: 'À payer'
due: 'Montant dû'
paid: 'Payé'
overpaid: 'Trop-perçu'
overpaidHint: 'Plus que le montant dû a été reçu.'
paidShare: 'Part payée'
adjusted: 'Défini manuellement'
quoted: "Affiché à l'inscription : {amount}"
answersDiffer: 'Les réponses donnent maintenant {amount}.'
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
  more: 'Autres actions de paiement'
  record: 'Enregistrer un paiement'
  request: 'Envoyer une demande de paiement'
  copyLink: 'Copier le lien de paiement'
  adjust: 'Modifier le montant'
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
  adjusted: 'Montant dû mis à jour'
</i18n>

<i18n lang="yaml" locale="pl">
balance: 'Zapłacono / należne'
open: 'Do zapłaty'
due: 'Do zapłaty'
paid: 'Zapłacono'
overpaid: 'Nadpłata'
overpaidHint: 'Wpłynęło więcej, niż wynosi należność.'
paidShare: 'Zapłacona część'
adjusted: 'Ustawione ręcznie'
quoted: 'Pokazane przy rejestracji: {amount}'
answersDiffer: 'Odpowiedzi dają teraz {amount}.'
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
  more: 'Więcej działań płatności'
  record: 'Zarejestruj płatność'
  request: 'Wyślij prośbę o płatność'
  copyLink: 'Kopiuj link do płatności'
  adjust: 'Zmień kwotę'
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
  adjusted: 'Zaktualizowano kwotę do zapłaty'
</i18n>

<i18n lang="yaml" locale="cs">
balance: 'Zaplaceno / splatné'
open: 'Nezaplaceno'
due: 'Splatné'
paid: 'Zaplaceno'
overpaid: 'Přeplaceno'
overpaidHint: 'Přišlo víc, než je splatné.'
paidShare: 'Zaplacený podíl'
adjusted: 'Nastaveno ručně'
quoted: 'Zobrazeno při registraci: {amount}'
answersDiffer: 'Odpovědi teď dávají {amount}.'
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
  more: 'Další akce plateb'
  record: 'Zaznamenat platbu'
  request: 'Poslat výzvu k platbě'
  copyLink: 'Kopírovat odkaz na platbu'
  adjust: 'Změnit částku'
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
  adjusted: 'Dlužná částka aktualizována'
</i18n>

<style scoped lang="scss">
@use '../../../css/segmented-list';

.balance-value {
  font-size: 1.125rem;
  font-weight: 600;
}

.balance-figures {
  gap: 12px;
  font-size: 0.8125rem;
  color: var(--md3-on-surface-variant);
}

.balance-figures strong {
  color: var(--md3-on-surface);
  font-variant-numeric: tabular-nums;
}

.balance-figures__overpaid,
.balance-figures__overpaid strong {
  color: var(--md3-tertiary);
}

.row-caption--warning {
  color: var(--md3-on-surface);
}

.row-value--muted {
  color: var(--md3-on-surface-variant);
}

.row-icon--muted {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}

.row-icon--action {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.inline-action {
  margin-left: 4px;
  font-weight: 500;
  color: var(--md3-primary);
  text-decoration: none;
}
</style>
