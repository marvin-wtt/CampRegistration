<template>
  <finance-tab-layout>
    <div
      v-if="loading"
      class="column income-stack"
    >
      <q-skeleton
        height="88px"
        class="rounded-xl"
      />
      <q-skeleton
        v-for="n in 3"
        :key="n"
        height="56px"
        class="rounded-md"
      />
    </div>

    <template v-else>
      <!-- What has arrived, out of all that is expected: promised income
           and fees still owed, less what is to be paid back. -->
      <finance-headline
        icon="savings"
        :eyebrow="t('headline.received')"
        :amount="money(received)"
        :caption="
          expected > received
            ? t('headline.ofExpected', { amount: money(expected) })
            : undefined
        "
        :accent="expected > 0 && received >= expected ? 'positive' : 'primary'"
        :badge="
          expected > 0
            ? {
                label: percent(received / expected),
                tone: received >= expected ? 'positive' : 'primary',
                icon: received >= expected ? 'check' : undefined,
              }
            : undefined
        "
        :segments="[
          { key: 'received', value: received, tone: 'primary' },
          { key: 'promised', value: promised, tone: 'info' },
          { key: 'fees', value: eventFees.outstanding, tone: 'warning' },
        ]"
        :stats="[
          {
            key: 'fees',
            label: t('headline.feesOpen'),
            value: money(eventFees.outstanding),
            tone: 'warning',
            shown: eventFees.outstanding > 0,
            to: feesLink('owing'),
          },
          {
            key: 'promised',
            label: t('headline.promised'),
            value: money(promised),
            tone: 'info',
            shown: promised > 0,
          },
          {
            key: 'refund',
            label: t('headline.toRefund'),
            value: money(eventFees.overpaid),
            tone: 'refund',
            shown: eventFees.overpaid > 0,
            to: feesLink('overpaid'),
          },
        ]"
        data-test="income-totals"
      />

      <!-- Fees, a row per group and a total: each opens the ledger. -->
      <template v-if="canSeeFees">
        <div class="text-subtitle1 text-weight-medium q-mt-sm">
          {{ t('fees') }}
        </div>
        <q-list class="income-list rounded-xl">
          <q-item
            v-for="row in feeRows"
            :key="`${row.group}-${row.currency}`"
            clickable
            :data-test="`income-fee-group-${row.group ?? 'none'}`"
            @click="emit('openFees', row.group)"
          >
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{
                  feeRows.length > 1
                    ? row.group
                      ? groupLabel(row.group)
                      : t('noGroup')
                    : t('fees')
                }}
              </q-item-label>
              <q-item-label caption>
                {{ t('registrations', row.count) }}
                <template v-if="row.outstanding > 0">
                  ·
                  <span class="text-warning">
                    {{
                      t('feesOpen', {
                        amount: money(row.outstanding, row.currency),
                      })
                    }}
                  </span>
                </template>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <span class="text-amount text-body1 text-on-surface">
                {{ money(row.received, row.currency) }}
              </span>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
          <!-- All groups together: the same ledger, unfiltered. -->
          <q-item
            v-if="feeRows.length > 1"
            clickable
            class="fee-total"
            data-test="income-fee-total"
            @click="emit('openFees', null)"
          >
            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ t('total') }}
              </q-item-label>
              <q-item-label caption>
                {{ t('registrations', feeTotal.count) }}
                <template v-if="feeTotal.outstanding > 0">
                  ·
                  <span class="text-warning">
                    {{ t('feesOpen', { amount: money(feeTotal.outstanding) }) }}
                  </span>
                </template>
                <!-- Other currencies are named, never converted. -->
                <template
                  v-for="other in feeTotal.others"
                  :key="other.currency"
                >
                  · +{{ money(other.received, other.currency) }}
                </template>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <span
                class="text-amount text-body1 text-weight-bold text-on-surface"
              >
                {{ money(feeTotal.received) }}
              </span>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </q-list>
      </template>

      <template v-if="canSeeIncome">
        <div class="text-subtitle1 text-weight-medium q-mt-sm">
          {{ t('other') }}
        </div>

        <div
          v-if="incomes.length === 0"
          class="income-empty column items-center text-center rounded-xl"
          data-test="income-empty"
        >
          <q-icon
            name="savings"
            size="40px"
            color="on-surface-variant"
          />
          <div class="text-body2 text-on-surface-variant q-mt-sm">
            {{ t('empty') }}
          </div>
        </div>

        <template v-else>
          <!-- Only once the list is long enough to look for something. -->
          <list-controls
            v-if="incomes.length > SEARCH_FROM"
            v-model:search="incomeSearch"
            v-model:sort="incomeSort"
            v-model:descending="incomeDescending"
            :sorts="incomeSorts"
            :placeholder="t('incomeSearch')"
            test-id="income"
          />
          <div
            v-if="shownIncomes.length === 0"
            class="text-body2 text-on-surface-variant q-py-md"
          >
            {{ t('noMatch') }}
          </div>
          <q-list
            v-else
            separator
            class="income-list rounded-xl"
          >
            <income-row
              v-for="income in shownIncomes"
              :key="income.id"
              :income
              :wide
              @open="dialogs.incomeDetails"
            />
          </q-list>
        </template>
      </template>
    </template>
  </finance-tab-layout>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import FinanceTabLayout from '@/components/event/finances/FinanceTabLayout.vue';
import FinanceHeadline from '@/components/event/finances/FinanceHeadline.vue';
import IncomeRow from '@/components/event/finances/IncomeRow.vue';
import ListControls from '@/components/common/ListControls.vue';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useFinanceStore } from '@/stores/finance-store';
import { LEDGER_SORTS, type LedgerSort, sortLedger } from '@/utils/ledgerSort';
import { matchesText } from '@/utils/textSearch';
import { useFinanceDialogs } from '@/composables/financeDialogs';
import { useFinanceFormat } from '@/composables/financeFormat';
import { usePermissions } from '@/composables/permissions';
import { useIncomeStore } from '@/stores/income-store';
import { useFeeStore } from '@/stores/fee-store';
import {
  feeTotalsByCurrency,
  feeTotalsByGroup,
  matchesFeeFilter,
} from '@/utils/registrationFee';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useGroupLabel } from '@/composables/groupLabel';

const emit = defineEmits<{ openFees: [group: string | null] }>();

const quasar = useQuasar();
const { t } = useI18n();
const dialogs = useFinanceDialogs();
const { to } = useObjectTranslation();
const financeStore = useFinanceStore();
const { can } = usePermissions();
const { money, currency, percent } = useFinanceFormat();
const incomeStore = useIncomeStore();
const feeStore = useFeeStore();

const canSeeIncome = computed(() => can('event.expenses.view'));
const canSeeFees = computed(() => can('event.payments.view'));

// Started here, not awaited: the stores flag themselves loading first.
watch(
  [canSeeIncome, canSeeFees],
  ([income, fees]) => {
    if (income) {
      void incomeStore.fetchData();
    }
    if (fees) {
      void feeStore.fetchData();
    }
  },
  { immediate: true },
);

const loading = computed(
  () =>
    (canSeeIncome.value && incomeStore.isLoading) ||
    (canSeeFees.value && feeStore.isLoading),
);
const wide = computed(() => quasar.screen.gt.xs);

const incomes = computed(() => incomeStore.incomes ?? []);

const SEARCH_FROM = 5;
const incomeSearch = ref<string | null>('');
const incomeSort = ref<LedgerSort>('date');
const incomeDescending = ref(true);
watch(incomeSort, () => {
  incomeDescending.value = true;
});
const incomeSorts = computed(() =>
  LEDGER_SORTS.map((value) => ({
    value,
    label: t(`sort.${value}`),
    direction: value === 'date' ? ('date' as const) : ('number' as const),
  })),
);
const shownIncomes = computed(() =>
  sortLedger(
    incomes.value.filter((income) =>
      matchesText(incomeSearch.value, [
        income.description,
        income.payerName,
        income.label,
        categoryName(income.categoryId),
      ]),
    ),
    incomeSort.value,
    incomeDescending.value,
    (income) => ({
      date: income.receivedOn,
      number: income.number,
      amount: income.amount,
    }),
  ),
);

function categoryName(id: string | null): string {
  const category = id ? financeStore.incomeCategoriesById.get(id) : undefined;
  return category ? to(category.name) : '';
}
const groupLabel = useGroupLabel();
const eventStore = useEventDetailsStore();
const fees = computed(() =>
  canSeeFees.value ? (feeStore.registrations ?? []) : [],
);
// Not accepted and nothing paid: nobody's business yet, as in the ledger.
const feeRows = computed(() =>
  feeTotalsByGroup(
    fees.value.filter((fee) => matchesFeeFilter(fee, 'all')),
    eventStore.data?.countries ?? [],
  ),
);

// The groups added up in the event's currency; others are listed apart.
const feeTotal = computed(() => {
  const relevant = fees.value.filter((fee) => matchesFeeFilter(fee, 'all'));
  const byCurrency = feeTotalsByCurrency(relevant, currency.value);
  const own = byCurrency.find((totals) => totals.currency === currency.value);

  return {
    count: relevant.length,
    received: own?.received ?? 0,
    outstanding: own?.outstanding ?? 0,
    others: byCurrency.filter((totals) => totals.currency !== currency.value),
  };
});

// Only the event's currency adds up with the other income.
const eventFees = computed(
  () =>
    feeTotalsByCurrency(fees.value, currency.value).find(
      (totals) => totals.currency === currency.value,
    ) ?? { received: 0, outstanding: 0, overpaid: 0 },
);

const received = computed(
  () =>
    incomes.value.reduce(
      (sum, income) => sum + (income.receivedOn ? income.amount : 0),
      0,
    ) + eventFees.value.received,
);
const promised = computed(() =>
  incomes.value.reduce(
    (sum, income) => sum + (income.receivedOn ? 0 : income.amount),
    0,
  ),
);
const feesLink = (fees: 'owing' | 'overpaid') => ({
  query: { tab: 'income', view: 'fees', fees },
});

const expected = computed(
  () =>
    received.value +
    promised.value +
    eventFees.value.outstanding -
    eventFees.value.overpaid,
);
</script>

<style scoped>
.income-stack {
  gap: 8px;
}

.fee-total {
  border-top: 1px solid var(--md3-outline-variant);
}

.income-list {
  overflow: hidden;
  border: 1px solid var(--md3-outline-variant);
  background: var(--md3-surface-container-low);
}

.income-empty {
  padding: 24px 16px;
  border: 1px dashed var(--md3-outline-variant);
}
</style>

<i18n lang="yaml" locale="en">
headline:
  received: 'Received'
  ofExpected: 'of {amount} expected'
  feesOpen: 'Fees still open'
  promised: 'Promised'
  toRefund: 'To pay back'
incomeSearch: 'Description, payer or number'
noMatch: 'Nothing matches the search.'
sort:
  date: 'Date'
  number: 'Number'
  amount: 'Amount'
total: 'Total'
registrations: '1 registration | {n} registrations'
noGroup: 'Without group'
fees: 'Registration fees'
feesOpen: '{amount} open'
other: 'Grants, donations and more'
empty: 'No other income yet. Record grants, donations and the like here.'
</i18n>

<i18n lang="yaml" locale="de">
headline:
  received: 'Eingegangen'
  ofExpected: 'von {amount} erwartet'
  feesOpen: 'Beiträge offen'
  promised: 'Zugesagt'
  toRefund: 'Zurückzuzahlen'
incomeSearch: 'Beschreibung, Geldgeber oder Nummer'
noMatch: 'Nichts passt zur Suche.'
sort:
  date: 'Datum'
  number: 'Nummer'
  amount: 'Betrag'
total: 'Gesamt'
registrations: '1 Anmeldung | {n} Anmeldungen'
noGroup: 'Ohne Gruppe'
fees: 'Teilnahmebeiträge'
feesOpen: '{amount} offen'
other: 'Zuschüsse, Spenden und mehr'
empty: 'Noch keine weiteren Einnahmen. Erfasse hier Zuschüsse, Spenden und Ähnliches.'
</i18n>

<i18n lang="yaml" locale="fr">
headline:
  received: 'Reçu'
  ofExpected: 'sur {amount} attendus'
  feesOpen: 'Frais en attente'
  promised: 'Promis'
  toRefund: 'À rembourser'
incomeSearch: 'Description, payeur ou numéro'
noMatch: 'Aucun résultat.'
sort:
  date: 'Date'
  number: 'Numéro'
  amount: 'Montant'
total: 'Total'
registrations: '1 inscription | {n} inscriptions'
noGroup: 'Sans groupe'
fees: 'Frais d’inscription'
feesOpen: '{amount} en attente'
other: 'Subventions, dons et plus'
empty: 'Pas encore d’autres recettes. Enregistre ici les subventions, dons et autres.'
</i18n>

<i18n lang="yaml" locale="pl">
headline:
  received: 'Wpłynęło'
  ofExpected: 'z oczekiwanych {amount}'
  feesOpen: 'Opłaty do zapłaty'
  promised: 'Obiecano'
  toRefund: 'Do zwrotu'
incomeSearch: 'Opis, płacący lub numer'
noMatch: 'Brak wyników wyszukiwania.'
sort:
  date: 'Data'
  number: 'Numer'
  amount: 'Kwota'
total: 'Razem'
registrations: 'Zgłoszenia: {n}'
noGroup: 'Bez grupy'
fees: 'Opłaty uczestników'
feesOpen: 'zaległe {amount}'
other: 'Dotacje, darowizny i inne'
empty: 'Brak innych przychodów. Zapisuj tu dotacje, darowizny i podobne.'
</i18n>

<i18n lang="yaml" locale="cs">
headline:
  received: 'Přijato'
  ofExpected: 'z očekávaných {amount}'
  feesOpen: 'Neuhrazené poplatky'
  promised: 'Přislíbeno'
  toRefund: 'K vrácení'
incomeSearch: 'Popis, plátce nebo číslo'
noMatch: 'Hledání nic nenašlo.'
sort:
  date: 'Datum'
  number: 'Číslo'
  amount: 'Částka'
total: 'Celkem'
registrations: 'Přihlášky: {n}'
noGroup: 'Bez skupiny'
fees: 'Účastnické poplatky'
feesOpen: 'nezaplaceno {amount}'
other: 'Dotace, dary a další'
empty: 'Zatím žádné další příjmy. Zaznamenejte sem dotace, dary a podobně.'
</i18n>
