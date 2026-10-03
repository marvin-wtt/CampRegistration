<template>
  <q-card
    flat
    bordered
    class="price-model-widget"
  >
    <q-card-section>
      <dashboard-card-header
        :icon="billed ? 'receipt_long' : 'sell'"
        tone="secondary"
        :title="t('title')"
      >
        <template #caption>
          <q-skeleton
            v-if="isLoading"
            type="text"
            width="8rem"
          />
          <span
            v-else-if="!priceModel"
            class="text-error"
          >
            {{ t('failed') }}
          </span>
          <template v-else>{{ to(priceModel.name) }}</template>
        </template>
        <template
          v-if="!isLoading && (billed || !priceModel)"
          #action
        >
          <event-bill-status-chip
            v-if="billed"
            :status="billed.status"
            class="q-ma-none"
          />
          <m-btn
            v-else
            :label="t('retry')"
            icon="refresh"
            primary
            text
            no-caps
            @click="store.fetchData()"
          />
        </template>
      </dashboard-card-header>
    </q-card-section>

    <q-card-section
      v-if="isLoading || priceModel"
      class="billing-body q-pt-none"
    >
      <div class="amount-block">
        <template v-if="isLoading">
          <q-skeleton
            type="text"
            width="9rem"
            class="amount-label"
          />
          <q-skeleton
            type="text"
            width="5rem"
            class="amount-value"
          />
          <q-skeleton
            type="text"
            width="80%"
            class="amount-breakdown"
          />
        </template>
        <template v-else-if="billed">
          <div class="amount-label">
            {{ t('billed', { count: billed.registrationCount }) }}
          </div>
          <div
            class="amount-value"
            :class="{ 'amount--void': billed.status === 'VOID' }"
          >
            {{ money(billed.grossAmount) }}
          </div>
        </template>
        <template v-else>
          <div class="amount-label">
            {{ t('current', { count: estimatedCount }) }}
          </div>
          <div class="amount-value">{{ money(estimate) }}</div>
          <div class="amount-breakdown">{{ breakdown }}</div>
        </template>
      </div>

      <q-skeleton
        v-if="isLoading"
        type="rect"
        height="44px"
        class="rounded-md"
      />
      <div
        v-else-if="!billed"
        class="billing-notice billing-notice--info row items-center no-wrap rounded-md"
      >
        <q-icon
          name="info"
          size="20px"
        />
        <span class="text-body2">
          {{ data?.bill ? t('hint.running') : t('hint.upcoming') }}
        </span>
      </div>
      <template v-else>
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
      </template>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useEventBillingStore } from '@/stores/event-billing-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatMoney } from '@/utils/money';
import EventBillStatusChip from '@/components/billing/EventBillStatusChip.vue';
import InvoiceList from '@/components/billing/InvoiceList.vue';

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
    const hasInvoice = bill.invoices.some(
      (invoice) => invoice.type === 'INVOICE',
    );

    return {
      tone: 'warning',
      icon: 'payments',
      text: hasInvoice ? t('notice.payInvoice') : t('notice.invoiceFollows'),
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
  Math.max(
    data.value?.acceptedRegistrationCount ?? 0,
    data.value?.bill?.startRegistrationCount ?? 0,
  ),
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

.billing-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.amount-block {
  padding: 12px 14px;
  background: var(--md3-surface-container-low);
  border-radius: 12px;
}

.amount-label,
.amount-breakdown {
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
}

.amount-value {
  margin: 2px 0;
  color: var(--md3-on-surface);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
}

.amount--void {
  color: var(--md3-on-surface-variant);
  text-decoration: line-through;
}

.billing-notice {
  gap: 10px;
  padding: 10px 12px;

  &--info {
    color: var(--md3-on-surface-variant);
    background: var(--md3-surface-container-high);
  }

  &--warning {
    color: var(--md3-on-warning-container);
    background: var(--md3-warning-container);
  }

  &--positive {
    color: var(--md3-on-positive-container);
    background: var(--md3-positive-container);
  }
}
</style>

<i18n lang="yaml" locale="en">
failed: 'Billing could not be loaded.'
retry: 'Retry'
title: 'Price model'
current: 'Current amount · {count} registrations'
hint:
  upcoming: "Based on today's registrations. The final amount is set when the event ends."
  running: 'You pay for the higher of the registration counts at the start and the end of the event.'
billed: 'Billed · {count} registrations'
breakdown: '{price} per registration + {baseFee} base fee, incl. {taxRate} % tax'
notice:
  payInvoice: 'Please pay the amount. The payment details are on the invoice below.'
  invoiceFollows: 'The invoice will follow.'
  paid: 'Paid on {date}. Thank you!'
</i18n>

<i18n lang="yaml" locale="de">
failed: 'Die Abrechnung konnte nicht geladen werden.'
retry: 'Erneut versuchen'
title: 'Preismodell'
current: 'Aktueller Stand · {count} Anmeldungen'
hint:
  upcoming: 'Berechnet aus den heutigen Anmeldungen. Der endgültige Betrag steht am Ende der Veranstaltung fest.'
  running: 'Abgerechnet wird die höhere Anmeldezahl zu Beginn oder am Ende der Veranstaltung.'
billed: 'Abgerechnet · {count} Anmeldungen'
breakdown: '{price} pro Anmeldung + {baseFee} Grundgebühr, inkl. {taxRate} % Steuer'
notice:
  payInvoice: 'Bitte den Betrag überweisen. Die Zahlungsdaten stehen auf der Rechnung unten.'
  invoiceFollows: 'Die Rechnung folgt.'
  paid: 'Bezahlt am {date}. Vielen Dank!'
</i18n>

<i18n lang="yaml" locale="fr">
failed: "La facturation n'a pas pu être chargée."
retry: 'Réessayer'
title: 'Modèle tarifaire'
current: 'Montant actuel · {count} inscriptions'
hint:
  upcoming: "Calculé à partir des inscriptions actuelles. Le montant définitif est fixé à la fin de l'événement."
  running: "Le nombre d'inscriptions le plus élevé entre le début et la fin de l'événement est facturé."
billed: 'Facturé · {count} inscriptions'
breakdown: '{price} par inscription + {baseFee} de frais de base, dont {taxRate} % de taxe'
notice:
  payInvoice: 'Veuillez régler le montant. Les coordonnées de paiement figurent sur la facture ci-dessous.'
  invoiceFollows: 'La facture suivra.'
  paid: 'Payé le {date}. Merci !'
</i18n>

<i18n lang="yaml" locale="pl">
failed: 'Nie udało się wczytać rozliczenia.'
retry: 'Spróbuj ponownie'
title: 'Model cenowy'
current: 'Kwota bieżąca · zgłoszenia: {count}'
hint:
  upcoming: 'Na podstawie dzisiejszych zgłoszeń. Ostateczna kwota zostanie ustalona po zakończeniu wydarzenia.'
  running: 'Rozliczana jest wyższa liczba zgłoszeń z początku lub końca wydarzenia.'
billed: 'Rozliczono · zgłoszenia: {count}'
breakdown: '{price} za zgłoszenie + {baseFee} opłaty podstawowej, w tym {taxRate} % podatku'
notice:
  payInvoice: 'Prosimy o zapłatę kwoty. Dane do płatności znajdują się na fakturze poniżej.'
  invoiceFollows: 'Faktura zostanie przesłana.'
  paid: 'Zapłacono {date}. Dziękujemy!'
</i18n>

<i18n lang="yaml" locale="cs">
failed: 'Vyúčtování se nepodařilo načíst.'
retry: 'Zkusit znovu'
title: 'Cenový model'
current: 'Aktuální částka · přihlášky: {count}'
hint:
  upcoming: 'Vychází z dnešních přihlášek. Konečná částka se stanoví po skončení akce.'
  running: 'Účtuje se vyšší počet přihlášek ze začátku nebo konce akce.'
billed: 'Vyúčtováno · přihlášky: {count}'
breakdown: '{price} za přihlášku + {baseFee} základní poplatek, vč. {taxRate} % daně'
notice:
  payInvoice: 'Uhraďte prosím částku. Platební údaje najdete na faktuře níže.'
  invoiceFollows: 'Faktura bude následovat.'
  paid: 'Zaplaceno {date}. Děkujeme!'
</i18n>
