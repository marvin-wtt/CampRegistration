<template>
  <q-card
    flat
    bordered
    class="payment-card"
    data-test="dashboard-payments"
  >
    <q-card-section class="q-pb-none">
      <dashboard-card-header
        icon="payments"
        :title="t('title')"
        :caption="t('subtitle')"
        :link="
          canOpen
            ? {
                label: t('allPayments'),
                to: tableRoute(LOCAL_TEMPLATE_PAYMENTS),
              }
            : undefined
        "
      />
    </q-card-section>

    <q-card-section class="payment-section">
      <div class="payment-grid">
        <div class="tile paid-tile">
          <div class="tile-label">{{ t('paidInFull') }}</div>
          <template v-if="loading">
            <q-skeleton
              type="text"
              width="5rem"
              class="paid-value"
            />
            <q-skeleton
              type="rect"
              height="10px"
              class="rounded-full"
            />
          </template>
          <template v-else>
            <div
              class="paid-value"
              data-test="dashboard-payments-paid"
            >
              <span>{{ summary.paid }}</span>
              <span class="paid-total">/ {{ summary.withFee }}</span>
            </div>
            <div
              class="payment-meter"
              role="img"
              :aria-label="
                t('meterLabel', { paid: summary.paid, total: summary.withFee })
              "
            >
              <div
                v-for="segment in segments"
                :key="segment.key"
                class="payment-meter__segment"
                :class="`payment-meter__segment--${segment.key}`"
                :style="{ width: `${segment.width}%` }"
              />
            </div>
            <ul class="payment-legend">
              <li
                v-for="item in legend"
                :key="item.key"
              >
                <span
                  class="legend-dot"
                  :class="`legend-dot--${item.key}`"
                />
                {{ item.text }}
              </li>
            </ul>
          </template>
        </div>

        <component
          :is="total.to ? RouterLink : 'div'"
          v-for="total in totals"
          :key="total.key"
          :to="total.to"
          class="tile kpi-tile"
          :class="{ 'kpi-tile--link': total.to }"
          :data-test="`dashboard-payments-${total.key}`"
        >
          <div class="kpi-text">
            <div class="tile-label">{{ total.label }}</div>
            <q-skeleton
              v-if="loading"
              type="text"
              width="5rem"
              class="kpi-value"
            />
            <div
              v-else
              class="kpi-value"
            >
              {{ money(total.value) }}
            </div>
            <div class="tile-caption kpi-caption">{{ total.caption }}</div>
          </div>
          <!-- Always takes its place, so the amounts line up. -->
          <q-icon
            name="chevron_right"
            size="20px"
            class="kpi-chevron"
            :class="{ 'kpi-chevron--hidden': !total.to }"
          />
        </component>
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { type RouteLocationRaw, RouterLink } from 'vue-router';
import { formatMoney } from '@camp-registration/common/utils';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import {
  owesFee,
  LOCAL_TEMPLATE_PAYMENTS,
  LOCAL_TEMPLATE_PAYMENTS_OPEN,
  paymentOpen,
} from '@/components/event/table/localTableTemplates';
import { useEventStatistics } from '@/composables/eventStatistics';
import { usePermissions } from '@/composables/permissions';
import type { EventPhase } from '@/composables/eventPhase';

const {
  currency,
  phase,
  loading = false,
} = defineProps<{
  currency: string;
  phase: EventPhase;
  loading?: boolean;
}>();

const { t, locale } = useI18n();
const stats = useEventStatistics();
const { can } = usePermissions();

const canOpen = computed(() => can('event.registrations.view'));

// Counts are of accepted registrations with a fee — the ones asked to pay.
// Collected money also includes what pending registrations paid up front.
const summary = computed(() => {
  const counts = { paid: 0, partial: 0, open: 0, refunded: 0 };
  let withFee = 0;
  let collected = 0;
  let outstanding = 0;

  for (const registration of stats.registrations.value) {
    const { payment } = registration;
    collected += payment.amountPaid;

    if (!owesFee(registration)) {
      continue;
    }
    withFee++;
    if (payment.status === 'PAID') {
      counts.paid++;
    } else if (payment.status === 'PARTIAL') {
      counts.partial++;
    } else if (payment.status === 'REFUNDED') {
      counts.refunded++;
    } else {
      counts.open++;
    }
    if (paymentOpen(registration)) {
      outstanding += payment.outstanding;
    }
  }

  return { ...counts, withFee, collected, outstanding };
});

const segments = computed(() => {
  const { withFee } = summary.value;
  const width = (n: number) => (withFee > 0 ? (n / withFee) * 100 : 0);

  return [
    { key: 'paid', width: width(summary.value.paid) },
    { key: 'partial', width: width(summary.value.partial) },
  ];
});

// Zero counts are left out, except open ones — "0 open" is the news.
const legend = computed(() =>
  (['paid', 'partial', 'open', 'refunded'] as const)
    .filter((key) => summary.value[key] > 0 || key === 'open')
    .map((key) => ({
      key,
      text: t(`legend.${key}`, { n: summary.value[key] }),
    })),
);

// While collecting, what is still missing leads; afterwards, what came in.
const totals = computed(() => {
  const owing = summary.value.partial + summary.value.open;
  const outstanding = {
    key: 'outstanding',
    label: t('outstanding'),
    caption: t('outstandingCaption', { n: owing }, owing),
    value: summary.value.outstanding,
    to:
      canOpen.value && summary.value.outstanding > 0
        ? tableRoute(LOCAL_TEMPLATE_PAYMENTS_OPEN)
        : undefined,
  };
  const collected = {
    key: 'collected',
    label: t('collected'),
    caption: t('collectedCaption'),
    value: summary.value.collected,
    to: canOpen.value ? tableRoute(LOCAL_TEMPLATE_PAYMENTS) : undefined,
  };

  return phase === 'wrapUp'
    ? [collected, outstanding]
    : [outstanding, collected];
});

function tableRoute(template: string): RouteLocationRaw {
  return { name: 'management.event.participants', query: { template } };
}

function money(minor: number): string {
  return formatMoney(minor, currency, locale.value);
}
</script>

<style scoped>
.payment-card {
  border-radius: 16px;
}

.payment-section {
  container-type: inline-size;
}

.payment-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.tile {
  min-width: 0;
  padding: 12px 14px;
  color: inherit;
  text-decoration: none;
  background: var(--md3-surface-container-low);
  border-radius: 12px;
}

.paid-tile {
  padding: 16px;
}

.tile-label {
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
  font-weight: 500;
}

.tile-caption {
  margin-top: 2px;
  color: var(--md3-on-surface-variant);
  font-size: 0.75rem;
}

.paid-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 2px 0 12px;
  color: var(--md3-on-surface);
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.paid-total {
  color: var(--md3-on-surface-variant);
  font-size: 1.25rem;
  font-weight: 500;
}

.payment-meter {
  display: flex;
  gap: 2px;
  height: 10px;
  overflow: hidden;
  background: var(--md3-surface-container-highest);
  border-radius: 999px;
}

.payment-meter__segment {
  height: 100%;
  transition: width 0.3s ease;
}

.payment-meter__segment--paid,
.legend-dot--paid {
  background: var(--md3-primary);
}

.payment-meter__segment--partial,
.legend-dot--partial {
  background: var(--md3-tertiary);
}

.payment-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin: 10px 0 0;
  padding: 0;
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
  list-style: none;
}

.payment-legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot--open {
  background: var(--md3-surface-container-highest);
  box-shadow: inset 0 0 0 1px var(--md3-outline);
}

.legend-dot--refunded {
  background: var(--md3-surface-container-highest);
  box-shadow: inset 0 0 0 2px var(--md3-secondary);
}

/* Narrow: each figure is a label/value row, as in the registrations card. */
.kpi-tile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kpi-text {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.kpi-value {
  color: var(--md3-on-surface);
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.kpi-caption {
  display: none;
}

.kpi-tile--link {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.kpi-tile--link:hover,
.kpi-tile--link:focus-visible {
  background: var(--md3-surface-container);
}

.kpi-chevron {
  color: var(--md3-on-surface-variant);
}

.kpi-chevron--hidden {
  visibility: hidden;
}

@container (min-width: 520px) {
  .payment-grid {
    grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr));
  }

  .kpi-tile {
    align-items: flex-start;
    padding: 16px;
  }

  .kpi-text {
    display: block;
  }

  .kpi-value {
    margin-top: 2px;
    font-size: 1.5rem;
  }

  .kpi-caption {
    display: block;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Payments'
subtitle: 'Fees of confirmed participants'
allPayments: 'All payments'
paidInFull: 'Paid in full'
meterLabel: '{paid} of {total} paid in full'
legend:
  paid: '{n} paid'
  partial: '{n} partly paid'
  open: '{n} open'
  refunded: '{n} refunded'
outstanding: 'Outstanding'
outstandingCaption: 'Nobody left to pay | From one person | From {n} people'
collected: 'Collected'
collectedCaption: 'Net of refunds'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zahlungen'
subtitle: 'Beiträge bestätigter Teilnehmender'
allPayments: 'Alle Zahlungen'
paidInFull: 'Vollständig bezahlt'
meterLabel: '{paid} von {total} vollständig bezahlt'
legend:
  paid: '{n} bezahlt'
  partial: '{n} teilweise bezahlt'
  open: '{n} offen'
  refunded: '{n} erstattet'
outstanding: 'Ausstehend'
outstandingCaption: 'Niemand mehr offen | Von einer Person | Von {n} Personen'
collected: 'Eingegangen'
collectedCaption: 'Abzüglich Erstattungen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Paiements'
subtitle: 'Frais des participants confirmés'
allPayments: 'Tous les paiements'
paidInFull: 'Entièrement payé'
meterLabel: '{paid} sur {total} entièrement payés'
legend:
  paid: '{n} payés'
  partial: '{n} partiellement payés'
  open: '{n} à payer'
  refunded: '{n} remboursés'
outstanding: 'En attente'
outstandingCaption: "Plus personne à payer | D'une personne | De {n} personnes"
collected: 'Encaissé'
collectedCaption: 'Remboursements déduits'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Płatności'
subtitle: 'Opłaty potwierdzonych uczestników'
allPayments: 'Wszystkie płatności'
paidInFull: 'Opłacone w całości'
meterLabel: 'W pełni opłacone: {paid} z {total}'
legend:
  paid: 'Opłacone: {n}'
  partial: 'Częściowo: {n}'
  open: 'Do zapłaty: {n}'
  refunded: 'Zwrócone: {n}'
outstanding: 'Do zapłaty'
outstandingCaption: 'Nikt nie zalega | Od jednej osoby | Liczba osób: {n}'
collected: 'Wpłacono'
collectedCaption: 'Po odliczeniu zwrotów'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Platby'
subtitle: 'Poplatky potvrzených účastníků'
allPayments: 'Všechny platby'
paidInFull: 'Zaplaceno v plné výši'
meterLabel: 'Zaplaceno v plné výši: {paid} z {total}'
legend:
  paid: 'Zaplaceno: {n}'
  partial: 'Částečně: {n}'
  open: 'Nezaplaceno: {n}'
  refunded: 'Vráceno: {n}'
outstanding: 'Nezaplaceno'
outstandingCaption: 'Nikdo nedluží | Od jedné osoby | Počet osob: {n}'
collected: 'Vybráno'
collectedCaption: 'Po odečtení vratek'
</i18n>
