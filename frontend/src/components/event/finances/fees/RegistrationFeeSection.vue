<template>
  <!-- A registration's fee at a glance; the fee dialog does the rest. -->
  <section
    v-if="can('event.payments.view') && fee"
    data-test="registration-fee"
  >
    <div class="fee-title">{{ t('title') }}</div>
    <div class="fee-card rounded-xl column no-wrap">
      <div class="row items-center no-wrap">
        <span class="fee-amount text-amount">{{ headline }}</span>
        <span
          v-if="headlineCaption"
          class="fee-caption ellipsis q-ml-sm"
        >
          {{ headlineCaption }}
        </span>
        <q-space />
        <payment-status-chip :status="fee.balance.status" />
      </div>

      <div v-if="progress !== null">
        <q-linear-progress
          :value="progress"
          :color="fee.balance.status === 'PAID' ? 'positive' : 'primary'"
          track-color="surface-container-highest"
          size="6px"
          rounded
        />
        <div class="fee-caption q-mt-xs">{{ summary }}</div>
      </div>

      <div class="row items-center no-wrap">
        <q-chip
          clickable
          dense
          icon="tag"
          color="surface-container"
          text-color="on-surface-variant"
          class="q-ma-none ellipsis"
          :aria-label="t('copy')"
          @click="copyReference"
        >
          {{ fee.reference }}
          <q-tooltip>{{ t('copy') }}</q-tooltip>
        </q-chip>
        <q-space />
        <m-btn
          v-if="can('event.payments.create')"
          tonal
          primary
          round
          dense
          icon="add"
          :aria-label="t('record')"
          @click="dialogs.record(fee)"
        >
          <q-tooltip>{{ t('record') }}</q-tooltip>
        </m-btn>
        <q-btn
          flat
          round
          dense
          icon="chevron_right"
          class="q-ml-xs"
          :aria-label="t('details')"
          @click="dialogs.details(fee)"
        >
          <q-tooltip>{{ t('details') }}</q-tooltip>
        </q-btn>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { copyToClipboard, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import PaymentStatusChip from '@/components/event/finances/fees/PaymentStatusChip.vue';
import { useFeeDialogs } from '@/composables/feeDialogs';
import { useFinanceFormat } from '@/composables/financeFormat';
import { usePermissions } from '@/composables/permissions';
import { useFeeStore } from '@/stores/fee-store';

const { registrationId } = defineProps<{ registrationId: string }>();

const quasar = useQuasar();
const { t } = useI18n();
const { money } = useFinanceFormat();
const { can } = usePermissions();
const feeStore = useFeeStore();
const dialogs = useFeeDialogs();

// Only those who may see fees ask for them.
watch(
  () => can('event.payments.view'),
  (allowed) => {
    if (allowed) {
      void feeStore.fetchData();
    }
  },
  { immediate: true },
);

const fee = computed(() => feeStore.byId.get(registrationId));

// As the fee dialog leads: what is open, an excess, or what came in.
const headline = computed(() => {
  if (!fee.value) {
    return '';
  }
  const { outstanding, overpaid, amountPaid, currency } = fee.value.balance;
  const amount =
    outstanding > 0 ? outstanding : overpaid > 0 ? overpaid : amountPaid;
  return money(amount, currency);
});

const headlineCaption = computed(() => {
  const { outstanding = 0, overpaid = 0 } = fee.value?.balance ?? {};
  // Otherwise the status chip already says it.
  return outstanding > 0 ? t('stillOpen') : overpaid > 0 ? t('overpaid') : null;
});

// `null` without an amount due: nothing to measure against.
const progress = computed<number | null>(() => {
  const { amountDue, amountPaid } = fee.value?.balance ?? {};
  if (!amountDue || amountPaid === undefined) {
    return null;
  }
  return Math.min(1, Math.max(0, amountPaid / amountDue));
});

const summary = computed(() => {
  if (!fee.value) {
    return '';
  }
  const { amountPaid, amountDue, currency } = fee.value.balance;
  return amountDue === null
    ? money(amountPaid, currency)
    : t('paidOf', {
        paid: money(amountPaid, currency),
        due: money(amountDue, currency),
      });
});

async function copyReference(): Promise<void> {
  if (!fee.value) {
    return;
  }
  await copyToClipboard(fee.value.reference);
  quasar.notify({ type: 'positive', message: t('copied') });
}
</script>

<style scoped>
.fee-card {
  gap: 10px;
  padding: 14px 16px;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface);
}

/* As the registration dialog titles its other sections. */
.fee-title {
  padding: 0 4px 8px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--md3-primary);
}

.fee-amount {
  font-size: 1.375rem;
  line-height: 1.75rem;
  font-weight: 500;
}

.fee-caption {
  font-size: 0.8125rem;
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Fee'
paidOf: '{paid} of {due} paid'
copy: 'Copy reference'
copied: 'Reference copied'
stillOpen: 'Still open'
overpaid: 'Paid too much'
details: 'Fee details'
record: 'Record payment'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Beitrag'
paidOf: '{paid} von {due} bezahlt'
copy: 'Verwendungszweck kopieren'
copied: 'Verwendungszweck kopiert'
stillOpen: 'Noch offen'
overpaid: 'Zu viel bezahlt'
details: 'Beitragsdetails'
record: 'Zahlung erfassen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Frais'
paidOf: '{paid} payés sur {due}'
copy: 'Copier la référence'
copied: 'Référence copiée'
stillOpen: 'Reste à payer'
overpaid: 'Trop payé'
details: 'Détails des frais'
record: 'Enregistrer un paiement'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Opłata'
paidOf: 'Zapłacono {paid} z {due}'
copy: 'Kopiuj tytuł przelewu'
copied: 'Skopiowano tytuł przelewu'
stillOpen: 'Pozostało do zapłaty'
overpaid: 'Nadpłata'
details: 'Szczegóły opłaty'
record: 'Zarejestruj płatność'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Poplatek'
paidOf: 'Zaplaceno {paid} z {due}'
copy: 'Kopírovat referenci'
copied: 'Reference zkopírována'
stillOpen: 'Zbývá zaplatit'
overpaid: 'Přeplaceno'
details: 'Podrobnosti poplatku'
record: 'Zaznamenat platbu'
</i18n>
