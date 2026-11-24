<template>
  <finance-tab-layout>
    <div
      v-if="loading"
      class="column fee-stack"
    >
      <q-skeleton
        height="96px"
        class="rounded-xl"
      />
      <q-skeleton
        v-for="n in 5"
        :key="n"
        height="56px"
        class="rounded-md"
      />
    </div>

    <template v-else>
      <!-- What came in out of what is due; other currencies apart. -->
      <finance-headline
        icon="payments"
        :eyebrow="t('headline.received')"
        :amount="money(totals.received, totals.currency)"
        :caption="caption"
        :accent="
          totals.expected > 0 && totals.outstanding === 0
            ? 'positive'
            : 'primary'
        "
        :badge="
          totals.expected > 0
            ? {
                label: percent(totals.received / totals.expected),
                tone: totals.outstanding === 0 ? 'positive' : 'primary',
                icon: totals.outstanding === 0 ? 'check' : undefined,
              }
            : undefined
        "
        :segments="[
          { key: 'received', value: totals.received, tone: 'primary' },
          { key: 'outstanding', value: totals.outstanding, tone: 'warning' },
        ]"
        data-test="fee-totals"
      />

      <!-- One row of controls; on phones the filters wait in a sheet. -->
      <list-controls
        v-model:search="search"
        v-model:sort="sort"
        :sorts="sortOptions"
        :placeholder="t('search')"
        test-id="fee"
      >
        <m-btn
          v-if="!wide"
          icon="tune"
          :color="activeFilters > 0 ? 'primary' : 'on-surface-variant'"
          flat
          round
          :aria-label="t('filters')"
          data-test="fee-filter-open"
          @click="sheetOpen = true"
        >
          <q-badge
            v-if="activeFilters > 0"
            :label="activeFilters"
            color="primary"
            floating
          />
        </m-btn>
        <template
          v-if="wide"
          #filters
        >
          <filter-chip
            v-for="value in FEE_FILTERS"
            :key="value"
            :active="filter === value"
            clickable
            :data-test="`fee-filter-${value}`"
            @click="filter = value"
          >
            {{ t(`filter.${value}`, { count: counts[value] }) }}
          </filter-chip>
        </template>
      </list-controls>

      <bottom-sheet
        v-if="!wide"
        v-model="sheetOpen"
      >
        <div class="column fee-sheet">
          <div class="text-subtitle1 text-weight-medium">
            {{ t('filters') }}
          </div>
          <div class="row fee-chips">
            <filter-chip
              v-for="value in FEE_FILTERS"
              :key="value"
              :active="filter === value"
              clickable
              @click="filter = value"
            >
              {{ t(`filter.${value}`, { count: counts[value] }) }}
            </filter-chip>
          </div>
        </div>
      </bottom-sheet>

      <div
        v-if="shown.length === 0"
        class="row items-center fee-empty text-body2 text-on-surface-variant q-py-lg"
      >
        <q-icon
          name="filter_alt_off"
          size="20px"
        />
        <span>{{ t('noMatch') }}</span>
      </div>
      <q-list
        v-else
        separator
        class="fee-list rounded-xl"
      >
        <q-item
          v-for="fee in shown"
          :key="fee.id"
          clickable
          data-test="fee-item"
          @click="dialogs.details(fee)"
        >
          <q-item-section>
            <q-item-label class="ellipsis text-weight-medium">
              {{ feeName(fee) }}
            </q-item-label>
            <q-item-label
              caption
              class="row items-center no-wrap fee-caption"
            >
              <span class="text-amount">{{ fee.reference }}</span>
              <payment-status-chip :status="fee.balance.status" />
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <span
              class="text-amount text-body1"
              :class="sideTone(fee)"
            >
              {{ sideAmount(fee) }}
            </span>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- The accounting record outlives the registration. -->
      <template v-if="orphaned.length > 0">
        <div class="text-overline text-on-surface-variant q-px-sm q-mt-lg">
          {{ t('orphaned') }}
        </div>
        <q-list class="fee-list rounded-xl">
          <q-item
            v-for="payment in orphaned"
            :key="payment.id"
            data-test="fee-orphaned"
          >
            <q-item-section>
              <q-item-label class="ellipsis">
                {{ payment.payerName ?? t('anonymous') }}
              </q-item-label>
              <q-item-label caption>
                {{ d(parseLocalDate(payment.paidOn), 'date') }} ·
                {{ t(`finance.fee.method.${payment.method}`) }}
                <template v-if="payment.settlement">
                  · {{ t(`settlement.${payment.settlement}`) }}
                </template>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <span class="text-amount">
                {{
                  money(payment.amount - refunded(payment), payment.currency)
                }}
              </span>
            </q-item-section>
            <q-item-section
              v-if="can('event.payments.refund') && payment.refundable > 0"
              side
            >
              <m-btn
                :label="t('refund')"
                size="sm"
                text
                rounded
                color="primary"
                @click="dialogs.refund(payment)"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </template>
    </template>
  </finance-tab-layout>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type {
  Payment,
  RegistrationFee,
} from '@camp-registration/common/entities';
import { refundedAmount } from '@camp-registration/common/utils';
import ListControls from '@/components/common/ListControls.vue';
import FilterChip from '@/components/common/FilterChip.vue';
import BottomSheet from '@/components/BottomSheet.vue';
import FinanceHeadline from '@/components/event/finances/FinanceHeadline.vue';
import FinanceTabLayout from '@/components/event/finances/FinanceTabLayout.vue';
import PaymentStatusChip from '@/components/event/finances/fees/PaymentStatusChip.vue';
import { useFeeDialogs } from '@/composables/feeDialogs';
import { useFinanceFormat } from '@/composables/financeFormat';
import { usePermissions } from '@/composables/permissions';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';
import { useFeeStore } from '@/stores/fee-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { parseLocalDate } from '@/utils/date';
import {
  FEE_FILTERS,
  FEE_SORTS,
  type FeeFilter,
  type FeeSort,
  sortFees,
  feeName,
  feeTotalsByCurrency,
  matchesFeeFilter,
  matchesFeeGroup,
  matchesFeeSearch,
} from '@/utils/registrationFee';

const quasar = useQuasar();
const { t, d } = useI18n();
const { money, currency, percent } = useFinanceFormat();
const { can } = usePermissions();
const { getEnumQueryParam, getStringQueryParam, setQueryParams } =
  useRouteQueryParams();
const eventStore = useEventDetailsStore();
const feeStore = useFeeStore();
const dialogs = useFeeDialogs();

// Started here, not awaited: the store flags itself loading first.
void feeStore.fetchData();

const loading = computed(() => feeStore.isLoading);
const wide = computed(() => quasar.screen.gt.xs);
const fees = computed(() => feeStore.registrations ?? []);
const orphaned = computed(() => feeStore.orphanedPayments ?? []);
const groups = computed(() => eventStore.data?.countries ?? []);

// Picked on the income tab: each group's row opens its own ledger.
const group = computed<string | null>(() => {
  const value = getStringQueryParam('group');
  return value !== null && groups.value.includes(value) ? value : null;
});
const inGroup = computed(() =>
  fees.value.filter((fee) => matchesFeeGroup(fee, group.value)),
);

// Per currency, the event's first: different currencies never add up.
const currencyTotals = computed(() =>
  feeTotalsByCurrency(inGroup.value, currency.value),
);
const totals = computed(
  () =>
    currencyTotals.value[0] ?? {
      currency: currency.value,
      expected: 0,
      received: 0,
      outstanding: 0,
      overpaid: 0,
    },
);
const otherTotals = computed(() => currencyTotals.value.slice(1));

// Other currencies are named beside the figure, never added to it.
const caption = computed(() =>
  [
    totals.value.expected > totals.value.received &&
      t('headline.ofExpected', {
        amount: money(totals.value.expected, totals.value.currency),
      }),
    ...otherTotals.value.map((other) =>
      t('otherCurrency', {
        received: money(other.received, other.currency),
        outstanding: money(other.outstanding, other.currency),
      }),
    ),
  ]
    .filter(Boolean)
    .join(' · '),
);

// Kept in the query, so the dashboard can link straight to a filter.
const filter = computed<FeeFilter>({
  get: () => getEnumQueryParam('fees', FEE_FILTERS) ?? 'all',
  set: (value) => setQueryParams({ fees: value === 'all' ? null : value }),
});
const search = ref<string | null>('');
const sheetOpen = ref(false);

const sort = computed<FeeSort>({
  get: () => getEnumQueryParam('sort', FEE_SORTS) ?? 'name',
  set: (value) => setQueryParams({ sort: value === 'name' ? null : value }),
});

const sortOptions = computed(() =>
  FEE_SORTS.map((value) => ({ value, label: t(`sort.${value}`) })),
);

// Shown on the filter button, which hides the chips on phones.
const activeFilters = computed(() => Number(filter.value !== 'all'));

const counts = computed(
  () =>
    Object.fromEntries(
      FEE_FILTERS.map((value) => [
        value,
        inGroup.value.filter((fee) => matchesFeeFilter(fee, value)).length,
      ]),
    ) as Record<FeeFilter, number>,
);

const shown = computed(() =>
  sortFees(
    inGroup.value.filter(
      (fee) =>
        matchesFeeFilter(fee, filter.value) &&
        matchesFeeSearch(fee, search.value ?? ''),
    ),
    sort.value,
  ),
);

// What still needs doing for this registration, if anything.
function sideAmount(fee: RegistrationFee): string {
  const { outstanding, overpaid, amountPaid, currency } = fee.balance;
  if (overpaid > 0) {
    return `+${money(overpaid, currency)}`;
  }
  if (fee.status === 'ACCEPTED' && outstanding > 0) {
    return money(outstanding, currency);
  }
  return money(amountPaid, currency);
}

function sideTone(fee: RegistrationFee): string {
  if (fee.balance.overpaid > 0) {
    return 'text-tertiary';
  }
  return fee.status === 'ACCEPTED' && fee.balance.outstanding > 0
    ? 'text-warning'
    : 'text-on-surface-variant';
}

function refunded(payment: Payment): number {
  return refundedAmount(payment);
}
</script>

<style scoped>
.fee-sheet {
  gap: 12px;
  padding-bottom: 8px;
}

.fee-stack,
.fee-chips,
.fee-empty,
.fee-caption {
  gap: 8px;
}

.fee-list {
  overflow: hidden;
  border: 1px solid var(--md3-outline-variant);
  background: var(--md3-surface-container-low);
}
</style>

<i18n lang="yaml" locale="en">
headline:
  received: 'Fees received'
  ofExpected: 'of {amount} expected'
filters: 'Filters'
sort:
  name: 'Name'
  reference: 'Reference'
  newest: 'Newest first'
  outstanding: 'Most open first'
otherCurrency: 'also {received} received, {outstanding} open'
search: 'Name or transfer reference'
filter:
  owing: 'Owing ({count})'
  overpaid: 'Overpaid ({count})'
  paid: 'Paid ({count})'
  all: 'All ({count})'
noMatch: 'No registrations match.'
orphaned: 'Payments of deleted registrations'
anonymous: 'Name removed'
refund: 'Refund'
settlement:
  RETAINED: 'kept'
</i18n>

<i18n lang="yaml" locale="de">
headline:
  received: 'Beiträge eingegangen'
  ofExpected: 'von {amount} erwartet'
filters: 'Filter'
sort:
  name: 'Name'
  reference: 'Verwendungszweck'
  newest: 'Neueste zuerst'
  outstanding: 'Höchster offener Betrag zuerst'
otherCurrency: 'dazu {received} eingegangen, {outstanding} offen'
search: 'Name oder Verwendungszweck'
filter:
  owing: 'Offen ({count})'
  overpaid: 'Überzahlt ({count})'
  paid: 'Bezahlt ({count})'
  all: 'Alle ({count})'
noMatch: 'Keine passenden Anmeldungen.'
orphaned: 'Zahlungen gelöschter Anmeldungen'
anonymous: 'Name entfernt'
refund: 'Erstatten'
settlement:
  RETAINED: 'einbehalten'
</i18n>

<i18n lang="yaml" locale="fr">
headline:
  received: 'Frais reçus'
  ofExpected: 'sur {amount} attendus'
filters: 'Filtres'
sort:
  name: 'Nom'
  reference: 'Référence'
  newest: 'Plus récentes d’abord'
  outstanding: 'Montant dû le plus élevé d’abord'
otherCurrency: 'plus {received} reçus, {outstanding} en attente'
search: 'Nom ou référence du virement'
filter:
  owing: 'À payer ({count})'
  overpaid: 'Trop payé ({count})'
  paid: 'Payé ({count})'
  all: 'Tous ({count})'
noMatch: 'Aucune inscription ne correspond.'
orphaned: 'Paiements des inscriptions supprimées'
anonymous: 'Nom retiré'
refund: 'Rembourser'
settlement:
  RETAINED: 'conservé'
</i18n>

<i18n lang="yaml" locale="pl">
headline:
  received: 'Wpłacone opłaty'
  ofExpected: 'z oczekiwanych {amount}'
filters: 'Filtry'
sort:
  name: 'Nazwisko'
  reference: 'Tytuł przelewu'
  newest: 'Najnowsze najpierw'
  outstanding: 'Najwyższa zaległość najpierw'
otherCurrency: 'oraz {received} wpłynęło, {outstanding} do zapłaty'
search: 'Imię i nazwisko lub tytuł przelewu'
filter:
  owing: 'Do zapłaty ({count})'
  overpaid: 'Nadpłacone ({count})'
  paid: 'Zapłacone ({count})'
  all: 'Wszystkie ({count})'
noMatch: 'Brak pasujących zgłoszeń.'
orphaned: 'Płatności usuniętych zgłoszeń'
anonymous: 'Dane usunięte'
refund: 'Zwróć'
settlement:
  RETAINED: 'zatrzymano'
</i18n>

<i18n lang="yaml" locale="cs">
headline:
  received: 'Přijaté poplatky'
  ofExpected: 'z očekávaných {amount}'
filters: 'Filtry'
sort:
  name: 'Jméno'
  reference: 'Variabilní symbol'
  newest: 'Nejnovější první'
  outstanding: 'Nejvyšší dluh první'
otherCurrency: 'navíc {received} přijato, {outstanding} neuhrazeno'
search: 'Jméno nebo reference platby'
filter:
  owing: 'Dluží ({count})'
  overpaid: 'Přeplaceno ({count})'
  paid: 'Zaplaceno ({count})'
  all: 'Vše ({count})'
noMatch: 'Žádné odpovídající registrace.'
orphaned: 'Platby smazaných registrací'
anonymous: 'Jméno odstraněno'
refund: 'Vrátit'
settlement:
  RETAINED: 'ponecháno'
</i18n>
