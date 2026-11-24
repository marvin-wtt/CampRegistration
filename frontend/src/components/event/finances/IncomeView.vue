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
      <!-- Only what has arrived counts as received; promises stay apart. -->
      <finance-totals-strip
        :dense="!wide"
        data-test="income-totals"
      >
        <finance-figures>
          <finance-figure
            :label="t('received')"
            :value="money(received)"
            lead
          />
          <finance-figure
            v-if="promised > 0"
            :label="t('promised')"
            :value="money(promised)"
          />
          <finance-figure
            v-if="eventFees.outstanding > 0"
            :label="t('feesOutstanding')"
            :value="money(eventFees.outstanding)"
            tone="warning"
          />
        </finance-figures>
      </finance-totals-strip>

      <!-- One source of income: the fee ledger opens as its own view. -->
      <q-item
        v-if="canSeeFees"
        clickable
        class="fees-card rounded-xl"
        data-test="income-fees"
        @click="emit('openFees')"
      >
        <q-item-section avatar>
          <q-icon
            name="groups"
            color="on-surface-variant"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">
            {{ t('fees') }}
          </q-item-label>
          <!-- A line per group, each in its own currency. -->
          <q-item-label
            v-for="row in feeRows"
            :key="`${row.group}-${row.currency}`"
            caption
            data-test="income-fees-group"
          >
            <template v-if="feeRows.length > 1">
              {{ row.group ? groupLabel(row.group) : t('noGroup') }}:
            </template>
            {{
              t('feesCaption', {
                received: money(row.received, row.currency),
              })
            }}
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
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>

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

        <q-list
          v-else
          class="income-list rounded-xl"
        >
          <q-item
            v-for="income in incomes"
            :key="income.id"
            :clickable="can('event.income.edit')"
            data-test="income-item"
            @click="openDialog(income)"
          >
            <q-item-section>
              <q-item-label class="ellipsis text-weight-medium">
                {{ income.description }}
              </q-item-label>
              <q-item-label
                caption
                class="ellipsis"
              >
                {{ meta(income) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <span
                class="text-amount text-body1"
                :class="{ 'text-on-surface-variant': !income.receivedOn }"
              >
                {{ money(income.amount) }}
              </span>
              <span
                v-if="income.receivedOn"
                class="text-caption"
              >
                {{ d(parseLocalDate(income.receivedOn), 'date') }}
              </span>
              <span
                v-else
                class="text-caption text-warning"
              >
                {{ t('promisedLabel') }}
              </span>
            </q-item-section>
          </q-item>
        </q-list>
      </template>
    </template>
  </finance-tab-layout>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Income } from '@camp-registration/common/entities';
import FinanceTabLayout from '@/components/event/finances/FinanceTabLayout.vue';
import FinanceTotalsStrip from '@/components/event/finances/FinanceTotalsStrip.vue';
import FinanceFigures from '@/components/event/finances/FinanceFigures.vue';
import FinanceFigure from '@/components/event/finances/FinanceFigure.vue';
import IncomeDialog from '@/components/event/finances/dialogs/IncomeDialog.vue';
import { useFinanceFormat } from '@/composables/financeFormat';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePermissions } from '@/composables/permissions';
import { useFinanceStore } from '@/stores/finance-store';
import { useIncomeStore } from '@/stores/income-store';
import { useFeeStore } from '@/stores/fee-store';
import { feeTotalsByCurrency, feeTotalsByGroup } from '@/utils/registrationFee';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useGroupLabel } from '@/composables/groupLabel';
import { parseLocalDate } from '@/utils/date';

const emit = defineEmits<{ openFees: [] }>();

const quasar = useQuasar();
const { t, d } = useI18n();
const { to } = useObjectTranslation();
const { can } = usePermissions();
const { money, currency } = useFinanceFormat();
const incomeStore = useIncomeStore();
const feeStore = useFeeStore();
const { incomeCategoriesById } = storeToRefs(useFinanceStore());

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
const groupLabel = useGroupLabel();
const eventStore = useEventDetailsStore();
const fees = computed(() =>
  canSeeFees.value ? (feeStore.registrations ?? []) : [],
);
const feeRows = computed(() =>
  feeTotalsByGroup(fees.value, eventStore.data?.countries ?? []),
);
// Only the event's currency adds up with the other income.
const eventFees = computed(
  () =>
    feeTotalsByCurrency(fees.value, currency.value).find(
      (totals) => totals.currency === currency.value,
    ) ?? { received: 0, outstanding: 0 },
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

function meta(income: Income): string {
  const category = income.categoryId
    ? incomeCategoriesById.value.get(income.categoryId)
    : undefined;

  return [income.label, income.payerName, category && to(category.name)]
    .filter(Boolean)
    .join(' · ');
}

function openDialog(income?: Income) {
  if (income && !can('event.income.edit')) {
    return;
  }
  quasar.dialog({ component: IncomeDialog, componentProps: { income } });
}
</script>

<style scoped>
.income-stack {
  gap: 8px;
}

.fees-card,
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
noGroup: 'Without group'
received: 'Received'
promised: 'Promised'
feesOutstanding: 'Fees still open'
fees: 'Registration fees'
feesCaption: '{received} received'
feesOpen: '{amount} open'
other: 'Grants, donations and more'
empty: 'No other income yet. Record grants, donations and the like here.'
promisedLabel: 'Promised'
</i18n>

<i18n lang="yaml" locale="de">
noGroup: 'Ohne Gruppe'
received: 'Eingegangen'
promised: 'Zugesagt'
feesOutstanding: 'Beiträge offen'
fees: 'Teilnahmebeiträge'
feesCaption: '{received} eingegangen'
feesOpen: '{amount} offen'
other: 'Zuschüsse, Spenden und mehr'
empty: 'Noch keine weiteren Einnahmen. Erfasse hier Zuschüsse, Spenden und Ähnliches.'
promisedLabel: 'Zugesagt'
</i18n>

<i18n lang="yaml" locale="fr">
noGroup: 'Sans groupe'
received: 'Reçu'
promised: 'Promis'
feesOutstanding: 'Frais en attente'
fees: 'Frais d’inscription'
feesCaption: '{received} reçus'
feesOpen: '{amount} en attente'
other: 'Subventions, dons et plus'
empty: 'Pas encore d’autres recettes. Enregistre ici les subventions, dons et autres.'
promisedLabel: 'Promis'
</i18n>

<i18n lang="yaml" locale="pl">
noGroup: 'Bez grupy'
received: 'Otrzymano'
promised: 'Obiecano'
feesOutstanding: 'Opłaty zaległe'
fees: 'Opłaty uczestników'
feesCaption: 'Otrzymano {received}'
feesOpen: 'zaległe {amount}'
other: 'Dotacje, darowizny i inne'
empty: 'Brak innych przychodów. Zapisuj tu dotacje, darowizny i podobne.'
promisedLabel: 'Obiecano'
</i18n>

<i18n lang="yaml" locale="cs">
noGroup: 'Bez skupiny'
received: 'Přijato'
promised: 'Přislíbeno'
feesOutstanding: 'Nezaplacené poplatky'
fees: 'Účastnické poplatky'
feesCaption: 'Přijato {received}'
feesOpen: 'nezaplaceno {amount}'
other: 'Dotace, dary a další'
empty: 'Zatím žádné další příjmy. Zaznamenejte sem dotace, dary a podobně.'
promisedLabel: 'Přislíbeno'
</i18n>
