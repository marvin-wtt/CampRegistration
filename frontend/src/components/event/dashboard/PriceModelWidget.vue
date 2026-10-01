<template>
  <q-card
    flat
    bordered
    class="price-model-widget"
  >
    <q-card-section class="price-model-content">
      <div class="price-model-icon row items-center justify-center">
        <q-icon
          :name="billed ? 'receipt_long' : 'sell'"
          size="22px"
        />
      </div>

      <div class="price-model-name">
        <div class="text-caption text-on-surface-variant">
          {{ t('title') }}
        </div>
        <q-skeleton
          v-if="isLoading"
          type="text"
          width="8rem"
          class="text-subtitle2"
        />
        <div
          v-else-if="!priceModel"
          class="row items-center no-wrap q-gutter-x-sm"
        >
          <span class="text-body2 text-error">{{ t('failed') }}</span>
          <q-btn
            :label="t('retry')"
            color="primary"
            size="sm"
            flat
            dense
            rounded
            no-caps
            class="q-px-sm"
            @click="store.fetchData()"
          />
        </div>
        <div
          v-else
          class="row items-center no-wrap q-gutter-x-sm"
        >
          <span class="text-subtitle2 text-weight-bold ellipsis">
            {{ to(priceModel.name) }}
          </span>
          <q-chip
            v-if="data?.isOverride"
            :label="t('override')"
            class="override-chip"
            dense
          />
        </div>
      </div>

      <!-- Billed: what the bill says, with its invoices -->
      <div
        v-if="billed"
        class="price-model-amount"
      >
        <div class="text-caption text-on-surface-variant">
          {{ t('billed', { count: billed.registrationCount }) }}
        </div>
        <div class="row items-center justify-end no-wrap q-gutter-x-sm">
          <event-bill-status-chip
            :status="billed.status"
            class="q-ma-none"
          />
          <span
            :class="{ 'amount--void': billed.status === 'VOID' }"
            class="text-subtitle1 text-weight-bold"
          >
            {{ money(billed.grossAmount) }}
          </span>
        </div>
      </div>

      <!-- Not billed yet: what today's registrations would cost -->
      <div
        v-else-if="priceModel"
        class="price-model-amount"
      >
        <div class="text-caption text-on-surface-variant">
          {{ t('estimate', { count: estimatedCount }) }}
        </div>
        <div class="text-subtitle1 text-weight-bold">
          {{ money(estimate) }}
        </div>
        <div class="text-caption text-on-surface-variant">
          {{ breakdown }}
        </div>
      </div>
    </q-card-section>

    <q-card-section
      v-if="billed && (notice || billed.invoices.length > 0)"
      class="billing-details q-pt-none"
    >
      <div
        v-if="notice"
        :class="`billing-notice--${notice.tone}`"
        class="billing-notice row items-center no-wrap rounded-md"
      >
        <q-icon
          :name="notice.icon"
          size="20px"
        />
        <span class="text-body2">{{ notice.text }}</span>
      </div>
      <invoice-list
        v-if="billed.invoices.length > 0"
        :invoices="billed.invoices"
        :owner="{ eventId: route.params.eventId as string }"
      />
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useEventBillingStore } from '@/stores/event-billing-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatMoney } from '@/utils/money';
import EventBillStatusChip from '@/components/billing/EventBillStatusChip.vue';
import InvoiceList from '@/components/billing/InvoiceList.vue';

const { registrations } = defineProps<{
  /** Accepted registrations right now. */
  registrations: number;
}>();

const { t, d, locale } = useI18n();
const route = useRoute();
const { to } = useObjectTranslation();
const store = useEventBillingStore();
const { data, isLoading } = storeToRefs(store);

void store.fetchData();

const priceModel = computed(() => data.value?.priceModel);

/** The bill once it is finalized; a running (DRAFT) bill is still estimated. */
const billed = computed(() => {
  const bill = data.value?.bill;

  return bill && bill.status !== 'DRAFT' ? bill : null;
});

const notice = computed<{
  tone: 'warning' | 'positive';
  icon: string;
  text: string;
} | null>(() => {
  const bill = billed.value;
  if (!bill) {
    return null;
  }
  if (bill.status === 'OPEN') {
    const amount = money(bill.grossAmount);
    const hasInvoice = bill.invoices.some(
      (invoice) => invoice.type === 'INVOICE',
    );

    return {
      tone: 'warning',
      icon: 'payments',
      text: hasInvoice
        ? t('notice.payInvoice', { amount })
        : t('notice.invoiceFollows', { amount }),
    };
  }
  if (bill.status === 'PAID' && bill.paidAt && bill.grossAmount !== '0.00') {
    return {
      tone: 'positive',
      icon: 'check_circle',
      text: t('notice.paid', { date: d(new Date(bill.paidAt), 'short') }),
    };
  }

  return null;
});

// A running event is billed for the higher of its start and end counts.
const estimatedCount = computed<number>(() =>
  Math.max(registrations, data.value?.bill?.startRegistrationCount ?? 0),
);

const cents = (amount: string) => Math.round(Number(amount) * 100);

// Mirrors the server's pricing in whole cents, rounding tax half-up.
const estimate = computed<string>(() => {
  if (!priceModel.value) {
    return '0';
  }
  const { baseFee, pricePerRegistration, taxRate } = priceModel.value;
  const net =
    cents(baseFee) + cents(pricePerRegistration) * estimatedCount.value;
  const tax = Math.round((net * Number(taxRate)) / 100);

  return ((net + tax) / 100).toFixed(2);
});

const breakdown = computed<string>(() => {
  if (!priceModel.value) {
    return '';
  }
  const { baseFee, pricePerRegistration, taxRate } = priceModel.value;

  return t('breakdown', {
    price: money(pricePerRegistration),
    baseFee: money(baseFee),
    taxRate: Number(taxRate).toLocaleString(locale.value),
  });
});

function money(amount: string | null): string {
  const currency = billed.value?.currency ?? priceModel.value?.currency;

  return formatMoney(amount, currency ?? null, locale.value);
}
</script>

<style scoped lang="scss">
.price-model-widget {
  border-radius: 16px;
}

.price-model-content {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px 16px;

  @media (max-width: 599px) {
    grid-template-columns: auto minmax(0, 1fr);

    .price-model-amount {
      grid-column: 1 / -1;
      align-items: flex-start;
      text-align: left;

      .justify-end {
        justify-content: flex-start;
      }
    }
  }
}

.price-model-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: var(--md3-on-secondary-container);
  background: var(--md3-secondary-container);
}

.price-model-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  text-align: right;
}

.override-chip {
  color: var(--md3-on-tertiary-container);
  background: var(--md3-tertiary-container);
}

.billing-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.billing-notice {
  gap: 10px;
  padding: 10px 12px;

  &--warning {
    color: var(--md3-on-warning-container);
    background: var(--md3-warning-container);
  }

  &--positive {
    color: var(--md3-on-positive-container);
    background: var(--md3-positive-container);
  }
}

.amount--void {
  color: var(--md3-on-surface-variant);
  text-decoration: line-through;
}
</style>

<i18n lang="yaml" locale="en">
failed: 'Billing could not be loaded.'
retry: 'Retry'
title: 'Price model'
override: 'Own model'
estimate: 'Estimated cost · {count} registrations'
billed: 'Billed · {count} registrations'
breakdown: '{price} per registration + {baseFee} base fee, incl. {taxRate} % tax'
notice:
  payInvoice: 'Please pay {amount}. The payment details are on the invoice below.'
  invoiceFollows: 'Open: {amount}. The invoice will follow.'
  paid: 'Paid on {date}. Thank you!'
</i18n>

<i18n lang="yaml" locale="de">
failed: 'Die Abrechnung konnte nicht geladen werden.'
retry: 'Erneut versuchen'
title: 'Preismodell'
override: 'Eigenes Modell'
estimate: 'Voraussichtliche Kosten · {count} Anmeldungen'
billed: 'Abgerechnet · {count} Anmeldungen'
breakdown: '{price} pro Anmeldung + {baseFee} Grundgebühr, inkl. {taxRate} % Steuer'
notice:
  payInvoice: 'Bitte {amount} überweisen. Die Zahlungsdaten stehen auf der Rechnung unten.'
  invoiceFollows: 'Offen: {amount}. Die Rechnung folgt.'
  paid: 'Bezahlt am {date}. Vielen Dank!'
</i18n>

<i18n lang="yaml" locale="fr">
failed: 'La facturation n''a pas pu être chargée.'
retry: 'Réessayer'
title: 'Modèle tarifaire'
override: 'Modèle propre'
estimate: 'Coût estimé · {count} inscriptions'
billed: 'Facturé · {count} inscriptions'
breakdown: '{price} par inscription + {baseFee} de frais de base, dont {taxRate} % de taxe'
notice:
  payInvoice: 'Veuillez régler {amount}. Les coordonnées de paiement figurent sur la facture ci-dessous.'
  invoiceFollows: 'Ouvert : {amount}. La facture suivra.'
  paid: 'Payé le {date}. Merci !'
</i18n>

<i18n lang="yaml" locale="pl">
failed: 'Nie udało się wczytać rozliczenia.'
retry: 'Spróbuj ponownie'
title: 'Model cenowy'
override: 'Własny model'
estimate: 'Szacowany koszt · zgłoszenia: {count}'
billed: 'Rozliczono · zgłoszenia: {count}'
breakdown: '{price} za zgłoszenie + {baseFee} opłaty podstawowej, w tym {taxRate} % podatku'
notice:
  payInvoice: 'Prosimy o zapłatę {amount}. Dane do płatności znajdują się na fakturze poniżej.'
  invoiceFollows: 'Do zapłaty: {amount}. Faktura zostanie przesłana.'
  paid: 'Zapłacono {date}. Dziękujemy!'
</i18n>

<i18n lang="yaml" locale="cs">
failed: 'Vyúčtování se nepodařilo načíst.'
retry: 'Zkusit znovu'
title: 'Cenový model'
override: 'Vlastní model'
estimate: 'Odhadované náklady · přihlášky: {count}'
billed: 'Vyúčtováno · přihlášky: {count}'
breakdown: '{price} za přihlášku + {baseFee} základní poplatek, vč. {taxRate} % daně'
notice:
  payInvoice: 'Uhraďte prosím {amount}. Platební údaje najdete na faktuře níže.'
  invoiceFollows: 'Otevřeno: {amount}. Faktura bude následovat.'
  paid: 'Zaplaceno {date}. Děkujeme!'
</i18n>
