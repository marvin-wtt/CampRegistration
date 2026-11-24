<template>
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <div
      class="finances-content col-12 col-md-11 col-lg-10 column no-wrap"
      :class="quasar.screen.xs ? 'q-gutter-y-sm' : 'q-gutter-y-md'"
    >
      <page-header
        :title="t('finance.title')"
        :subtitle="quasar.screen.xs ? undefined : t('finance.subtitle')"
        :inline-actions="quasar.screen.lt.md"
      >
        <template #actions>
          <m-btn
            v-if="addAction && quasar.screen.gt.sm"
            :label="addAction.label"
            icon="add"
            color="primary"
            data-test="finance-add"
            @click="addAction.onClick"
          />
          <responsive-menu
            v-if="can('event.finances.configure')"
            :items="menuItems"
            :label="t('finance.action.more')"
            data-test="finance-menu"
          />
        </template>
      </page-header>

      <!-- A sub-page of the income tab: its way back takes the tab bar's
           place, at the same height, as phones do it. -->
      <div
        v-if="tab === 'income' && showFees"
        class="finance-subheader row items-center no-wrap"
        data-test="fees-header"
      >
        <m-btn
          icon="arrow_back"
          color="on-surface"
          flat
          round
          :aria-label="t('finance.tab.income')"
          data-test="fees-back"
          @click="closeFees"
        />
        <!-- Where it sits: the parent tab above, small, like a breadcrumb. -->
        <div class="column col finance-subheader__title">
          <span class="text-caption text-on-surface-variant ellipsis">
            {{ t('finance.tab.income') }}
          </span>
          <span class="text-subtitle1 text-weight-medium ellipsis">
            {{ t('finance.fee.title') }}
          </span>
        </div>
        <!-- The group: one filter for the total, a switch between groups. -->
        <q-btn
          v-if="groups.length > 1"
          :label="
            selectedGroup
              ? groupLabel(selectedGroup)
              : t('finance.fee.allGroups')
          "
          icon-right="arrow_drop_down"
          color="secondary-container"
          text-color="on-secondary-container"
          unelevated
          rounded
          no-caps
          dense
          class="finance-subheader__group"
          data-test="fees-group"
        >
          <q-menu auto-close>
            <q-list style="min-width: 200px">
              <q-item
                v-for="option in groupOptions"
                :key="option.value ?? 'all'"
                clickable
                :active="selectedGroup === option.value"
                :data-test="`fees-group-${option.value ?? 'all'}`"
                @click="setQueryParams({ group: option.value })"
              >
                <q-item-section>{{ option.label }}</q-item-section>
                <q-item-section
                  v-if="selectedGroup === option.value"
                  side
                >
                  <q-icon name="check" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
      <q-tabs
        v-else
        v-model="tab"
        :align="quasar.screen.xs ? 'justify' : 'left'"
        no-caps
        inline-label
        active-color="primary"
        indicator-color="primary"
        class="finance-tabs"
        :breakpoint="0"
      >
        <q-tab
          v-for="value in tabs"
          :key="value"
          :name="value"
          :label="t(`finance.tab.${value}`)"
          :data-test="`finance-tab-${value}`"
        />
      </q-tabs>

      <!-- Their own data and loading state, and for their own permissions.
           The fee ledger opens from the income tab as a view of its own. -->
      <template v-if="tab === 'income'">
        <fees-view v-if="showFees" />
        <income-view
          v-else
          @open-fees="openFees"
        />
      </template>

      <div
        v-else-if="loading"
        class="column q-gutter-y-sm"
      >
        <q-skeleton
          v-for="n in 5"
          :key="n"
          height="56px"
          class="rounded-md"
        />
      </div>

      <!-- Nothing recorded yet: the same invitation on both lists -->
      <div
        v-else-if="tab !== 'balances' && expenses.length === 0"
        class="column items-center q-py-xl text-center"
        data-test="finance-empty"
      >
        <q-icon
          name="receipt_long"
          size="64px"
          class="text-on-surface-variant"
        />
        <div class="text-h6 q-mt-md">{{ t('finance.empty.title') }}</div>
        <div class="text-body2 text-on-surface-variant q-mt-xs">
          {{ t('finance.empty.message') }}
        </div>
        <m-btn
          v-if="can('event.expenses.create')"
          class="q-mt-lg"
          :label="t('finance.action.addExpense')"
          icon="add"
          color="primary"
          @click="dialogs.capture"
        />
      </div>

      <expenses-view
        v-else-if="tab === 'expenses'"
        :expenses
        :categories
      />

      <balances-view
        v-else-if="tab === 'balances'"
        :balances="financeStore.balances ?? []"
        :payouts="financeStore.payouts ?? []"
      />

      <template v-else-if="tab === 'summary'">
        <!-- The store's own state decides: no data also means failed. -->
        <div
          v-if="financeStore.summaryError"
          class="column items-center q-py-xl text-center"
          data-test="finance-summary-error"
        >
          <q-icon
            name="error_outline"
            size="48px"
            color="negative"
          />
          <div class="text-body1 q-mt-md">
            {{ financeStore.summaryError }}
          </div>
          <m-btn
            :label="t('finance.action.retry')"
            icon="refresh"
            tonal
            class="q-mt-md"
            @click="financeStore.retrySummary"
          />
        </div>
        <summary-view
          v-else-if="financeStore.summary && !financeStore.summaryIsLoading"
          :summary="financeStore.summary"
          :categories
        />
        <div
          v-else
          class="column q-gutter-y-md"
        >
          <q-skeleton
            height="96px"
            class="rounded-lg"
          />
          <q-skeleton
            height="240px"
            class="rounded-xl"
          />
        </div>
      </template>
    </div>

    <!-- Phone: the capture button stays one tap away -->
    <q-page-sticky
      v-if="addAction && quasar.screen.lt.md"
      position="bottom-right"
      :offset="[16, 16]"
    >
      <m-btn
        fab
        icon="add"
        :label="addAction.short"
        color="primary-container"
        text-color="on-primary-container"
        allow-color
        no-caps
        data-test="finance-add-fab"
        @click="addAction.onClick"
      />
    </q-page-sticky>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import PageHeader from '@/components/common/PageHeader.vue';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import ResponsiveMenu, {
  type ResponsiveMenuItem,
} from '@/components/common/ResponsiveMenu.vue';
import ExpensesView from '@/components/event/finances/ExpensesView.vue';
import BalancesView from '@/components/event/finances/BalancesView.vue';
import SummaryView from '@/components/event/finances/SummaryView.vue';
import FeesView from '@/components/event/finances/fees/FeesView.vue';
import IncomeView from '@/components/event/finances/IncomeView.vue';
import { useFinanceStore } from '@/stores/finance-store';
import { useFinanceDialogs } from '@/composables/financeDialogs';
import { usePermissions } from '@/composables/permissions';
import { useRouteTab } from '@/composables/routeTab';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';
import { useGroupLabel } from '@/composables/groupLabel';
import { useEventDetailsStore } from '@/stores/event-details-store';

const quasar = useQuasar();
const { t } = useI18n();
const { can } = usePermissions();
const financeStore = useFinanceStore();
const dialogs = useFinanceDialogs();

type FinanceTab = 'expenses' | 'balances' | 'income' | 'summary';

// Someone who sees only fees (a viewer) has no expense data to load.
const expenseAccess = computed(
  () => can('event.expenses.create') || can('event.expenses.view'),
);

// Started during setup, not awaited: the store flags itself loading first.
watch(
  expenseAccess,
  (access) => {
    if (access) {
      void financeStore.fetchData();
    }
  },
  { immediate: true },
);

const tabs = computed(() => {
  // Money out and in side by side, then settling up, then the result.
  const list: FinanceTab[] = [];
  if (expenseAccess.value) {
    list.push('expenses');
  }
  if (can('event.expenses.view') || can('event.payments.view')) {
    list.push('income');
  }
  if (expenseAccess.value) {
    list.push('balances');
  }
  if (can('event.expenses.view')) {
    list.push('summary');
  }
  return list;
});
const tab = useRouteTab(tabs);

// Loaded when its tab opens: only those who may see it ever ask, and the
// permissions are certain by then.
watch(
  tab,
  (value) => {
    if (value === 'summary') {
      void financeStore.loadSummary();
    }
  },
  { immediate: true },
);

const { getStringQueryParam, setQueryParams } = useRouteQueryParams();

// A dashboard link to a fee filter lands on the ledger straight away, and
// someone who sees only fees has nothing else on this tab.
const showFees = computed(
  () =>
    getStringQueryParam('view') === 'fees' ||
    getStringQueryParam('fees') !== null,
);

// A group's ledger, or every group's from a dashboard link.
function openFees(group: string | null) {
  setQueryParams({ view: 'fees', group });
}

const groupLabel = useGroupLabel();
const eventDetailsStore = useEventDetailsStore();
const groups = computed(() => eventDetailsStore.data?.countries ?? []);
const selectedGroup = computed(() => {
  const group = getStringQueryParam('group');
  return group !== null && groups.value.includes(group) ? group : null;
});
const groupOptions = computed(() => [
  { value: null, label: t('finance.fee.allGroups') },
  ...groups.value.map((value) => ({ value, label: groupLabel(value) })),
]);

function closeFees() {
  setQueryParams({ view: null, fees: null, group: null });
}

// The ledger is part of the income tab: leaving it leaves the ledger too.
watch(tab, (value) => {
  if (
    value !== 'income' &&
    (getStringQueryParam('view') !== null ||
      getStringQueryParam('fees') !== null)
  ) {
    closeFees();
  }
});

// The main add action follows the tab: income there, expenses elsewhere.
const addAction = computed(() => {
  if (tab.value === 'income') {
    return can('event.income.create') && !showFees.value
      ? {
          label: t('finance.action.addIncome'),
          short: t('finance.action.income'),
          onClick: dialogs.income,
        }
      : null;
  }
  return can('event.expenses.create')
    ? {
        label: t('finance.action.addExpense'),
        short: t('finance.action.expense'),
        onClick: dialogs.capture,
      }
    : null;
});

const menuItems = computed<ResponsiveMenuItem[]>(() => [
  {
    label: t('finance.categories.title'),
    icon: 'category',
    // Opens on the list the tab is about.
    onClick: () =>
      dialogs.categories(tab.value === 'income' ? 'INCOME' : 'EXPENSE'),
  },
  {
    label: t('finance.settings.title'),
    icon: 'tag',
    onClick: dialogs.settings,
  },
]);

const loading = computed(() => financeStore.isLoading);
const error = computed(() => financeStore.error);
const expenses = computed(() => financeStore.expenses ?? []);
const categories = computed(() => financeStore.categories ?? []);
</script>

<style scoped>
.finances-content {
  max-width: 1200px;
  padding-bottom: 96px;
}

.finance-tabs {
  border-bottom: 1px solid var(--md3-outline-variant);
}

/* The tab bar's height and rule, so swapping one for the other moves nothing. */
.finance-subheader {
  gap: 4px;
  min-height: 48px;
  border-bottom: 1px solid var(--md3-outline-variant);
}

.finance-subheader__title {
  min-width: 0;
  line-height: 1.25;
}

.finance-subheader__group {
  flex: none;
  padding-inline: 12px 6px;
}
</style>
