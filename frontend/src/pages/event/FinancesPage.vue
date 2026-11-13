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
        :subtitle="t('finance.subtitle')"
        :inline-actions="quasar.screen.lt.md"
      >
        <template #actions>
          <m-btn
            v-if="can('event.expenses.create') && quasar.screen.gt.sm"
            :label="t('finance.action.addExpense')"
            icon="add"
            color="primary"
            data-test="finance-add"
            @click="dialogs.capture"
          />
          <responsive-menu
            v-if="can('event.finances.configure')"
            :items="menuItems"
            :label="t('finance.action.more')"
            data-test="finance-menu"
          />
        </template>
      </page-header>

      <q-tabs
        v-model="tab"
        align="left"
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

      <div
        v-if="loading"
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
      v-if="can('event.expenses.create') && quasar.screen.lt.md"
      position="bottom-right"
      :offset="[16, 16]"
    >
      <q-btn
        fab
        icon="add"
        :label="t('finance.action.expense')"
        color="primary-container"
        text-color="on-primary-container"
        no-caps
        data-test="finance-add-fab"
        @click="dialogs.capture"
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
import { useFinanceStore } from '@/stores/finance-store';
import { useFinanceDialogs } from '@/composables/financeDialogs';
import { usePermissions } from '@/composables/permissions';
import { useRouteTab } from '@/composables/routeTab';

const quasar = useQuasar();
const { t } = useI18n();
const { can } = usePermissions();
const financeStore = useFinanceStore();
const dialogs = useFinanceDialogs();

// Started during setup, not awaited: the store flags itself loading first.
void financeStore.fetchData();

const tabs = computed(() =>
  can('event.expenses.view')
    ? (['expenses', 'balances', 'summary'] as const)
    : (['expenses', 'balances'] as const),
);
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

const menuItems = computed<ResponsiveMenuItem[]>(() => [
  {
    label: t('finance.categories.title'),
    icon: 'category',
    onClick: dialogs.categories,
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
</style>
