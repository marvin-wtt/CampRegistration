<template>
  <q-page class="column">
    <div
      class="absolute fit column"
      :class="tabBarBottom ? 'reverse' : ''"
    >
      <div class="col-shrink">
        <!-- Desktop navigation -->
        <q-separator v-if="tabBarBottom" />
        <q-tabs
          v-model="tab"
          :inline-label="!tabBarBottom"
          :switch-indicator="tabBarBottom"
          align="justify"
        >
          <q-tab
            :label="t('list')"
            icon="category"
            name="category"
          />
          <q-tab
            :label="t('list')"
            icon="list"
            name="overview"
          />
          <q-tab
            :label="t('person')"
            icon="person"
            name="person"
          />
        </q-tabs>
        <q-separator v-if="!tabBarBottom" />
      </div>

      <q-tab-panels
        v-model="tab"
        :swipeable="tabBarBottom"
        animated
        class="col"
      >
        <expenses-grouped-panel
          name="category"
          :title="t('panel.category')"
          group-by="category"
          :expenses
        />

        <expenses-list-panel
          name="overview"
          :expenses
        />

        <expenses-grouped-panel
          name="person"
          :title="t('panel.person')"
          group-by="paidBy"
          :expenses
        />
      </q-tab-panels>
    </div>
    <q-page-sticky
      position="bottom-right"
      :offset="tabBarBottom ? [18, 78] : [18, 18]"
    >
      <q-btn
        class="absolute-bottom-right q-ma-md"
        color="primary"
        fab
        icon="add"
        style="z-index: 10"
        @click="onAddExpense()"
      />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';
import { Expense } from '@camp-registration/common/entities';
import ExpensesListPanel from 'components/campManagement/expenses/ExpensesListPanel.vue';
import ExpenseCreateDialog from 'components/campManagement/expenses/ExpenseCreateDialog.vue';
import { useRoute, useRouter } from 'vue-router';
import ExpensesGroupedPanel from 'components/campManagement/expenses/ExpensesGroupedPanel.vue';

const { t } = useI18n();
const quasar = useQuasar();
const router = useRouter();
const route = useRoute();

const allowedFragments = ['category', 'overview', 'person'];

const tab = ref<string>(initialTab());

function initialTab(): string {
  const fragment =
    route.hash && route.hash.length > 0 ? route.hash.substring(1) : null;

  return fragment && allowedFragments.includes(fragment) ? fragment : 'list';
}

watch(tab, (value) => {
  router.replace({
    hash: `#${value}`,
  });
});

const events = ref([
  {
    id: '01JA1HR0ACWQR6F60FHPKQQ1FG ',
    receiptNumber: 1,
    name: 'First expense',
    category: 'test',
    amount: 100,
    date: new Date().toISOString(),
    paidBy: 'Marvin',
    recipient: null,
    description: null,
    fileId: null,
    paidAt: null,
  },
  {
    id: '01JA1HR465XSKERARZ4CKNQ3YC ',
    receiptNumber: 2,
    name: 'Second expense',
    category: 'test',
    amount: 100,
    date: new Date().toISOString(),
    paidBy: null,
    recipient: null,
    description: null,
    fileId: null,
    paidAt: null,
  },
]);

const expenses = computed<Expense[]>(() => {
  return events.value
    .toSorted((a, b) => a.receiptNumber ?? 0 - b.receiptNumber ?? 0)
    .reverse();
});

const people = computed<string[]>(() => {
  const names = events.value
    .map((value) => value.paidBy)
    .filter((value) => value != null);

  const uniqueNames = [...new Set(names)];

  return uniqueNames.sort((a, b) => a.localeCompare(b));
});

const locales = computed<string[]>(() => {
  // TODO
  return [];
});

const tabBarBottom = computed<boolean>(() => {
  return quasar.platform.has.touch;
});

function onAddExpense() {
  quasar.dialog({
    component: ExpenseCreateDialog,
    componentProps: {
      locales: locales.value,
      people: people.value,
    },
  });
}
</script>

<i18n lang="yaml" locale="en">
panel:
  person: 'Expenses by person'
  category: 'Expense by category'
</i18n>
