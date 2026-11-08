<template>
  <template v-if="canRecord">
    <q-separator />
    <q-item
      v-close-popup
      clickable
      data-test="registration-record-payment"
      @click="record"
    >
      <q-item-section>
        {{ t('action.record') }}
      </q-item-section>
    </q-item>
    <q-item
      v-if="canRequest"
      v-close-popup
      clickable
      data-test="registration-request-payment"
      @click="request"
    >
      <q-item-section>
        {{ t('action.request') }}
      </q-item-section>
    </q-item>
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type {
  PaymentCreateData,
  Registration,
  RegistrationPaymentDetails,
} from '@camp-registration/common/entities';
import { usePaymentStore } from '@/stores/payment-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { usePermissions } from '@/composables/permissions';
import { useErrorExtractor } from '@/composables/serviceHandler';
import RecordPaymentDialog from '@/components/event/payment/RecordPaymentDialog.vue';

/** A registration menu's payment entries: record a payment, ask for one. */
const { registration, balance } = defineProps<{
  registration: Registration;
  balance: RegistrationPaymentDetails;
}>();

const quasar = useQuasar();
const { t } = useI18n();
const { can } = usePermissions();
const { extractErrorText } = useErrorExtractor();
const paymentStore = usePaymentStore();
const eventDetailsStore = useEventDetailsStore();

// Only for registrations that owe a fee; the request only once accepted.
const canRecord = computed<boolean>(
  () => can('event.payments.create') && balance.status !== 'NOT_REQUIRED',
);
const canRequest = computed<boolean>(
  () => registration.status === 'ACCEPTED' && balance.outstanding > 0,
);

async function run(action: () => Promise<unknown>, success: string) {
  try {
    await action();
    quasar.notify({ type: 'positive', message: success });
  } catch (err) {
    quasar.notify({ type: 'negative', message: extractErrorText(err) });
  }
}

function record() {
  const eventId = eventDetailsStore.data?.id;
  if (!eventId) {
    return;
  }
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

function request() {
  const eventId = eventDetailsStore.data?.id;
  if (!eventId) {
    return;
  }
  void run(
    () => paymentStore.request(eventId, registration.id),
    t('notify.requested'),
  );
}
</script>

<i18n lang="yaml" locale="en">
action:
  record: 'Record payment'
  request: 'Send payment request'
notify:
  recorded: 'Payment recorded'
  requested: 'Payment request sent'
</i18n>

<i18n lang="yaml" locale="de">
action:
  record: 'Zahlung erfassen'
  request: 'Zahlungsaufforderung senden'
notify:
  recorded: 'Zahlung erfasst'
  requested: 'Zahlungsaufforderung gesendet'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  record: 'Enregistrer un paiement'
  request: 'Envoyer une demande de paiement'
notify:
  recorded: 'Paiement enregistré'
  requested: 'Demande de paiement envoyée'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  record: 'Zarejestruj płatność'
  request: 'Wyślij wezwanie do zapłaty'
notify:
  recorded: 'Zarejestrowano płatność'
  requested: 'Wysłano wezwanie do zapłaty'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  record: 'Zaznamenat platbu'
  request: 'Odeslat výzvu k platbě'
notify:
  recorded: 'Platba zaznamenána'
  requested: 'Výzva k platbě odeslána'
</i18n>
