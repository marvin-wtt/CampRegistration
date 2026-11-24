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
      <!-- What is open leads; the rest beside it once there is room. -->
      <finance-totals-strip
        :dense="!wide"
        :alert="totals.outstanding > 0"
        data-test="fee-totals"
      >
        <finance-figures>
          <finance-figure
            :label="t('outstanding')"
            :value="money(totals.outstanding, totals.currency)"
            :tone="totals.outstanding > 0 ? 'warning' : undefined"
            lead
          />
          <finance-figure
            :label="t('received')"
            :value="money(totals.received, totals.currency)"
          />
          <template v-if="wide">
            <finance-figure
              :label="t('expected')"
              :value="money(totals.expected, totals.currency)"
            />
            <finance-figure
              v-if="totals.overpaid > 0"
              :label="t('overpaid')"
              :value="money(totals.overpaid, totals.currency)"
              tone="refund"
            />
          </template>
        </finance-figures>
        <!-- Another currency never adds up with the event's: its own line. -->
        <div
          v-for="other in otherTotals"
          :key="other.currency"
          class="text-caption text-on-surface-variant q-mt-xs"
          data-test="fee-other-currency"
        >
          {{
            t('otherCurrency', {
              received: money(other.received, other.currency),
              outstanding: money(other.outstanding, other.currency),
            })
          }}
        </div>
      </finance-totals-strip>

      <!-- Only for events with more than one group. -->
      <div
        v-if="groups.length > 1"
        class="row fee-chips"
      >
        <filter-chip
          :active="group === null"
          clickable
          data-test="fee-group-all"
          @click="group = null"
        >
          {{ t('allGroups') }}
        </filter-chip>
        <filter-chip
          v-for="value in groups"
          :key="value"
          :active="group === value"
          clickable
          :data-test="`fee-group-${value}`"
          @click="group = value"
        >
          {{ groupLabel(value) }}
        </filter-chip>
      </div>

      <q-input
        v-model="search"
        :placeholder="t('search')"
        outlined
        rounded
        dense
        clearable
        debounce="150"
        data-test="fee-search"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <div class="row fee-chips">
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
      </div>

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
import FilterChip from '@/components/common/FilterChip.vue';
import FinanceFigure from '@/components/event/finances/FinanceFigure.vue';
import FinanceTotalsStrip from '@/components/event/finances/FinanceTotalsStrip.vue';
import FinanceTabLayout from '@/components/event/finances/FinanceTabLayout.vue';
import FinanceFigures from '@/components/event/finances/FinanceFigures.vue';
import PaymentStatusChip from '@/components/event/finances/fees/PaymentStatusChip.vue';
import { useFeeDialogs } from '@/composables/feeDialogs';
import { useFinanceFormat } from '@/composables/financeFormat';
import { usePermissions } from '@/composables/permissions';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';
import { useFeeStore } from '@/stores/fee-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useGroupLabel } from '@/composables/groupLabel';
import { parseLocalDate } from '@/utils/date';
import {
  FEE_FILTERS,
  type FeeFilter,
  feeName,
  feeTotalsByCurrency,
  matchesFeeFilter,
  matchesFeeGroup,
  matchesFeeSearch,
} from '@/utils/registrationFee';

const quasar = useQuasar();
const { t, d } = useI18n();
const { money, currency } = useFinanceFormat();
const groupLabel = useGroupLabel();
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

// Kept in the query like the filter, so a link can open one group.
const group = computed<string | null>({
  get: () => {
    const value = getStringQueryParam('group');
    return value !== null && groups.value.includes(value) ? value : null;
  },
  set: (value) => setQueryParams({ group: value }),
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

// Kept in the query, so the dashboard can link straight to a filter.
const filter = computed<FeeFilter>({
  get: () => getEnumQueryParam('fees', FEE_FILTERS) ?? 'all',
  set: (value) => setQueryParams({ fees: value === 'all' ? null : value }),
});
const search = ref<string | null>('');

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
  inGroup.value.filter(
    (fee) =>
      matchesFeeFilter(fee, filter.value) &&
      matchesFeeSearch(fee, search.value ?? ''),
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
allGroups: 'All groups'
otherCurrency: 'Also in another currency: {received} received · {outstanding} open'
outstanding: 'Still open'
received: 'Received'
expected: 'Expected'
overpaid: 'To give back'
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
  SETTLED_OUTSIDE: 'settled outside the app'
</i18n>

<i18n lang="yaml" locale="de">
allGroups: 'Alle Gruppen'
otherCurrency: 'Außerdem in anderer Währung: {received} eingegangen · {outstanding} offen'
outstanding: 'Noch offen'
received: 'Eingegangen'
expected: 'Erwartet'
overpaid: 'Zurückzuzahlen'
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
  SETTLED_OUTSIDE: 'außerhalb der App abgerechnet'
</i18n>

<i18n lang="yaml" locale="fr">
allGroups: 'Tous les groupes'
otherCurrency: 'Aussi dans une autre devise : {received} reçus · {outstanding} en attente'
outstanding: 'Reste à payer'
received: 'Reçu'
expected: 'Attendu'
overpaid: 'À rendre'
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
  SETTLED_OUTSIDE: "réglé hors de l'application"
</i18n>

<i18n lang="yaml" locale="pl">
allGroups: 'Wszystkie grupy'
otherCurrency: 'Także w innej walucie: otrzymano {received} · zaległe {outstanding}'
outstanding: 'Do zapłaty'
received: 'Wpłynęło'
expected: 'Oczekiwane'
overpaid: 'Do zwrotu'
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
  SETTLED_OUTSIDE: 'rozliczono poza aplikacją'
</i18n>

<i18n lang="yaml" locale="cs">
allGroups: 'Všechny skupiny'
otherCurrency: 'Také v jiné měně: přijato {received} · nezaplaceno {outstanding}'
outstanding: 'Zbývá zaplatit'
received: 'Přijato'
expected: 'Očekáváno'
overpaid: 'K vrácení'
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
  SETTLED_OUTSIDE: 'vyúčtováno mimo aplikaci'
</i18n>
