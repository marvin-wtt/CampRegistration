<template>
  <page-state-handler
    :loading
    :error
    class="row justify-center content-center q-pa-md"
  >
    <q-card
      v-if="summary"
      flat
      class="payment-card rounded-xl elevation-1 col-12"
      data-test="registration-payment"
      :data-test-status="summary.status"
    >
      <q-card-section class="column items-center q-gutter-y-sm text-center">
        <q-avatar
          size="88px"
          font-size="44px"
          :color="state.color"
          :text-color="`on-${state.color}`"
          :icon="waiting ? undefined : state.icon"
        >
          <q-spinner
            v-if="waiting"
            size="40px"
            :thickness="4"
          />
        </q-avatar>

        <div
          class="text-h5 text-weight-medium"
          data-test="registration-payment-title"
        >
          {{ t(`state.${state.key}.title`) }}
        </div>
        <p class="text-body1 payment-card__text q-mb-none">
          {{ t(`state.${state.key}.text`) }}
        </p>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-list
          bordered
          separator
          class="rounded-lg"
        >
          <q-item v-if="summary.amountDue !== null">
            <q-item-section>{{ t('amount.due') }}</q-item-section>
            <q-item-section
              side
              class="text-weight-medium"
              data-test="registration-payment-due"
            >
              {{ money(summary.amountDue) }}
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>{{ t('amount.paid') }}</q-item-section>
            <q-item-section
              side
              class="text-weight-medium"
              data-test="registration-payment-paid"
            >
              {{ money(summary.amountPaid) }}
            </q-item-section>
          </q-item>
          <q-item v-if="outstanding > 0">
            <q-item-section>{{ t('amount.outstanding') }}</q-item-section>
            <q-item-section
              side
              class="text-weight-bold"
            >
              {{ money(outstanding) }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-section
        v-if="checkoutError"
        class="q-pt-none"
      >
        <q-banner
          dense
          rounded
          class="bg-error-container text-on-error-container text-body2"
        >
          {{ checkoutError }}
        </q-banner>
      </q-card-section>

      <q-card-actions
        v-if="summary.payable && !waiting"
        align="center"
        class="q-pb-md"
      >
        <m-btn
          primary
          icon="payments"
          :label="lastAttemptFailed ? t('action.retry') : t('action.pay')"
          :loading="checkingOut"
          data-test="registration-payment-pay"
          @click="pay"
        />
      </q-card-actions>
    </q-card>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMeta } from 'quasar';
import { useRoute } from 'vue-router';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { RegistrationPaymentSummary } from '@camp-registration/common/entities';
import { formatMoney } from '@camp-registration/common/utils';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { usePaymentService } from '@/services/PaymentService';
import { useErrorExtractor } from '@/composables/serviceHandler';

const props = defineProps<{
  eventId: string;
  registrationId: string;
}>();

// While a just-started payment is still settling, poll for this long.
const POLL_INTERVAL_MS = 3000;
const POLL_ATTEMPTS = 10;

const { t, locale } = useI18n();
const route = useRoute();
const { fetchPaymentSummary, startCheckout } = usePaymentService();
const { extractErrorText } = useErrorExtractor();

const token = computed<string>(() =>
  typeof route.query.token === 'string' ? route.query.token : '',
);

const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const summary = ref<RegistrationPaymentSummary | null>(null);
const checkingOut = ref<boolean>(false);
const checkoutError = ref<string | null>(null);

let pollTimer: ReturnType<typeof setTimeout> | undefined;
// Only a participant coming back from the provider waits for the payment to
// settle; anyone else opening the link sees the state as it is.
const pollsLeft = ref<number>(route.query.returned ? POLL_ATTEMPTS : 0);

useMeta(() => ({
  title: t('title'),
  titleTemplate: (pageTitle: string) => `${pageTitle} | ${t('app_name')}`,
}));

const outstanding = computed<number>(() => {
  if (!summary.value || summary.value.amountDue === null) {
    return 0;
  }

  return Math.max(0, summary.value.amountDue - summary.value.amountPaid);
});

// A checkout the participant may have just come back from, not yet settled.
const inFlight = computed<boolean>(
  () =>
    summary.value?.latestPaymentStatus === 'OPEN' ||
    summary.value?.latestPaymentStatus === 'PENDING',
);

const waiting = computed<boolean>(
  () => inFlight.value && pollsLeft.value > 0 && outstanding.value > 0,
);

const lastAttemptFailed = computed<boolean>(() =>
  ['FAILED', 'CANCELED', 'EXPIRED'].includes(
    summary.value?.latestPaymentStatus ?? '',
  ),
);

interface State {
  key: string;
  color: string;
  icon: string;
}

const state = computed<State>(() => {
  const status = summary.value?.status;

  if (status === 'PAID' || status === 'NOT_REQUIRED') {
    return { key: 'paid', color: 'positive-container', icon: 'check_circle' };
  }
  if (status === 'REFUNDED') {
    return { key: 'refunded', color: 'info-container', icon: 'undo' };
  }
  if (summary.value?.latestPaymentStatus === 'PENDING') {
    return { key: 'pending', color: 'info-container', icon: 'schedule' };
  }
  if (waiting.value) {
    return { key: 'checking', color: 'primary-container', icon: 'schedule' };
  }
  if (lastAttemptFailed.value) {
    return { key: 'failed', color: 'error-container', icon: 'error' };
  }
  if (!summary.value?.payable) {
    return { key: 'unavailable', color: 'warning-container', icon: 'info' };
  }
  if (status === 'PARTIAL') {
    return { key: 'partial', color: 'warning-container', icon: 'payments' };
  }

  return { key: 'unpaid', color: 'primary-container', icon: 'payments' };
});

function money(minor: number): string {
  return formatMoney(minor, summary.value?.currency ?? 'EUR', locale.value);
}

async function load(): Promise<void> {
  try {
    summary.value = await fetchPaymentSummary(
      props.eventId,
      props.registrationId,
      token.value,
    );
    error.value = null;
  } catch (err) {
    error.value = extractErrorText(err);
  } finally {
    loading.value = false;
  }

  schedulePoll();
}

function schedulePoll(): void {
  clearTimeout(pollTimer);
  if (!waiting.value) {
    return;
  }

  pollsLeft.value--;
  pollTimer = setTimeout(() => void load(), POLL_INTERVAL_MS);
}

async function pay(): Promise<void> {
  checkingOut.value = true;
  checkoutError.value = null;

  try {
    const { checkoutUrl } = await startCheckout(
      props.eventId,
      props.registrationId,
      token.value,
    );
    window.location.assign(checkoutUrl);
  } catch (err) {
    checkoutError.value = extractErrorText(err);
    checkingOut.value = false;
  }
}

onMounted(load);

onBeforeUnmount(() => {
  clearTimeout(pollTimer);
});
</script>

<style lang="scss" scoped>
.payment-card {
  max-width: 480px;
}

.payment-card__text {
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Payment'
amount:
  due: 'Amount due'
  paid: 'Paid'
  outstanding: 'Outstanding'
action:
  pay: 'Pay now'
  retry: 'Try again'
state:
  paid:
    title: 'Payment complete'
    text: 'Thank you! Your payment has been received.'
  refunded:
    title: 'Payment refunded'
    text: 'Your payment has been refunded.'
  pending:
    title: 'Payment processing'
    text: 'Your payment is being processed. This can take a moment for some payment methods — we will email you once it is confirmed.'
  checking:
    title: 'Checking your payment…'
    text: 'Please wait while we confirm your payment with the payment provider.'
  failed:
    title: 'Payment not completed'
    text: 'Your last payment attempt did not go through. You have not been charged — please try again.'
  unavailable:
    title: 'Payment not available yet'
    text: 'Online payment is not possible for this registration right now. The organizer will let you know when and how to pay.'
  partial:
    title: 'Partially paid'
    text: 'Part of the fee has been paid. Please pay the remaining amount.'
  unpaid:
    title: 'Pay your participation fee'
    text: 'Pay securely online with the payment provider of the organizer.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zahlung'
amount:
  due: 'Fälliger Betrag'
  paid: 'Bezahlt'
  outstanding: 'Offen'
action:
  pay: 'Jetzt bezahlen'
  retry: 'Erneut versuchen'
state:
  paid:
    title: 'Zahlung abgeschlossen'
    text: 'Vielen Dank! Deine Zahlung ist eingegangen.'
  refunded:
    title: 'Zahlung erstattet'
    text: 'Deine Zahlung wurde zurückerstattet.'
  pending:
    title: 'Zahlung wird verarbeitet'
    text: 'Deine Zahlung wird verarbeitet. Bei manchen Zahlungsmethoden kann das etwas dauern — wir schicken dir eine E-Mail, sobald sie bestätigt ist.'
  checking:
    title: 'Zahlung wird geprüft…'
    text: 'Bitte warte, während wir deine Zahlung beim Zahlungsanbieter bestätigen.'
  failed:
    title: 'Zahlung nicht abgeschlossen'
    text: 'Dein letzter Zahlungsversuch ist nicht durchgegangen. Es wurde nichts abgebucht — bitte versuche es erneut.'
  unavailable:
    title: 'Zahlung noch nicht möglich'
    text: 'Eine Online-Zahlung ist für diese Anmeldung derzeit nicht möglich. Der Veranstalter teilt dir mit, wann und wie du bezahlen kannst.'
  partial:
    title: 'Teilweise bezahlt'
    text: 'Ein Teil des Beitrags wurde bezahlt. Bitte bezahle den restlichen Betrag.'
  unpaid:
    title: 'Teilnahmebeitrag bezahlen'
    text: 'Bezahle sicher online über den Zahlungsanbieter des Veranstalters.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Paiement'
amount:
  due: 'Montant dû'
  paid: 'Payé'
  outstanding: 'Restant'
action:
  pay: 'Payer maintenant'
  retry: 'Réessayer'
state:
  paid:
    title: 'Paiement effectué'
    text: 'Merci ! Ton paiement a bien été reçu.'
  refunded:
    title: 'Paiement remboursé'
    text: 'Ton paiement a été remboursé.'
  pending:
    title: 'Paiement en cours'
    text: "Ton paiement est en cours de traitement. Cela peut prendre un moment selon le moyen de paiement — nous t'enverrons un e-mail dès qu'il sera confirmé."
  checking:
    title: 'Vérification du paiement…'
    text: 'Merci de patienter pendant que nous confirmons ton paiement auprès du prestataire de paiement.'
  failed:
    title: 'Paiement non abouti'
    text: "Ta dernière tentative de paiement n'a pas abouti. Tu n'as pas été débité — merci de réessayer."
  unavailable:
    title: 'Paiement pas encore disponible'
    text: "Le paiement en ligne n'est pas possible pour cette inscription pour le moment. L'organisateur t'indiquera quand et comment payer."
  partial:
    title: 'Partiellement payé'
    text: 'Une partie des frais a été payée. Merci de régler le montant restant.'
  unpaid:
    title: 'Payer les frais de participation'
    text: "Paie en toute sécurité en ligne via le prestataire de paiement de l'organisateur."
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Płatność'
amount:
  due: 'Kwota do zapłaty'
  paid: 'Zapłacono'
  outstanding: 'Pozostało'
action:
  pay: 'Zapłać teraz'
  retry: 'Spróbuj ponownie'
state:
  paid:
    title: 'Płatność zakończona'
    text: 'Dziękujemy! Twoja płatność została otrzymana.'
  refunded:
    title: 'Płatność zwrócona'
    text: 'Twoja płatność została zwrócona.'
  pending:
    title: 'Płatność w toku'
    text: 'Twoja płatność jest przetwarzana. Przy niektórych metodach płatności może to chwilę potrwać — wyślemy Ci e-mail, gdy zostanie potwierdzona.'
  checking:
    title: 'Sprawdzamy płatność…'
    text: 'Poczekaj, aż potwierdzimy Twoją płatność u operatora płatności.'
  failed:
    title: 'Płatność nie została zakończona'
    text: 'Twoja ostatnia próba płatności nie powiodła się. Nie pobrano żadnych środków — spróbuj ponownie.'
  unavailable:
    title: 'Płatność jeszcze niedostępna'
    text: 'Płatność online dla tego zgłoszenia nie jest obecnie możliwa. Organizator poinformuje Cię, kiedy i jak zapłacić.'
  partial:
    title: 'Częściowo opłacone'
    text: 'Część opłaty została uiszczona. Prosimy o zapłatę pozostałej kwoty.'
  unpaid:
    title: 'Opłać udział'
    text: 'Zapłać bezpiecznie online przez operatora płatności organizatora.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Platba'
amount:
  due: 'Částka k úhradě'
  paid: 'Zaplaceno'
  outstanding: 'Zbývá'
action:
  pay: 'Zaplatit nyní'
  retry: 'Zkusit znovu'
state:
  paid:
    title: 'Platba dokončena'
    text: 'Děkujeme! Tvoje platba byla přijata.'
  refunded:
    title: 'Platba vrácena'
    text: 'Tvoje platba byla vrácena.'
  pending:
    title: 'Platba se zpracovává'
    text: 'Tvoje platba se zpracovává. U některých platebních metod to může chvíli trvat — jakmile bude potvrzena, pošleme ti e-mail.'
  checking:
    title: 'Ověřujeme platbu…'
    text: 'Počkej prosím, než platbu ověříme u poskytovatele plateb.'
  failed:
    title: 'Platba nebyla dokončena'
    text: 'Tvůj poslední pokus o platbu neprošel. Nic ti nebylo strženo — zkus to prosím znovu.'
  unavailable:
    title: 'Platba zatím není možná'
    text: 'Online platba pro tuto registraci momentálně není možná. Organizátor ti dá vědět, kdy a jak zaplatit.'
  partial:
    title: 'Částečně zaplaceno'
    text: 'Část poplatku byla zaplacena. Uhraď prosím zbývající částku.'
  unpaid:
    title: 'Zaplať účastnický poplatek'
    text: 'Zaplať bezpečně online přes platebního poskytovatele organizátora.'
</i18n>
