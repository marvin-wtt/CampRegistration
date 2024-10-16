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
            :label="t('tab.category')"
            icon="category"
            name="category"
          />
          <q-tab
            :label="t('tab.overview')"
            icon="list"
            name="overview"
          />
          <q-tab
            :label="t('tab.person')"
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
      v-if="campDetailsStore.data"
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
import { computed, onMounted, ref, watch } from 'vue';
import { Expense } from '@camp-registration/common/entities';
import ExpensesListPanel from 'components/campManagement/expenses/ExpensesListPanel.vue';
import ExpenseCreateDialog from 'components/campManagement/expenses/ExpenseCreateDialog.vue';
import { useRoute, useRouter } from 'vue-router';
import ExpensesGroupedPanel from 'components/campManagement/expenses/ExpensesGroupedPanel.vue';
import { useExpensesStore } from 'stores/expense-store.ts';
import { useCampDetailsStore } from 'stores/camp-details-store.ts';

const { t } = useI18n();
const quasar = useQuasar();
const router = useRouter();
const route = useRoute();
const expensesStore = useExpensesStore();
const campDetailsStore = useCampDetailsStore();

const allowedFragments = ['category', 'overview', 'person'];

onMounted(() => {
  campDetailsStore.fetchData();
  expensesStore.fetchData();
});

const tab = ref<string>(initialTab());

function initialTab(): string {
  const fragment =
    route.hash && route.hash.length > 0 ? route.hash.substring(1) : null;

  return fragment && allowedFragments.includes(fragment)
    ? fragment
    : 'overview';
}

watch(tab, (value) => {
  router.replace({
    hash: `#${value}`,
  });
});

const expenses = computed<Expense[] | undefined>(() => {
  if (!expensesStore.data) {
    return undefined;
  }

  return expensesStore.data
    .toSorted((a, b) => (a.receiptNumber ?? 0) - (b.receiptNumber ?? 0))
    .reverse();
});

const people = computed<string[]>(() => {
  if (!expensesStore.data) {
    return [];
  }

  const names = expensesStore.data
    .map((value) => value.paidBy)
    .filter((value) => value != null);

  const uniqueNames = [...new Set(names)];

  return uniqueNames.sort((a, b) => a.localeCompare(b));
});

const categories = computed<string[]>(() => {
  if (!expensesStore.data) {
    return [];
  }

  const categories = expensesStore.data
    .map((value) => value.category)
    .filter((value) => value != null);

  const uniqueCategories = [...new Set(categories)];

  return uniqueCategories.sort((a, b) => a.localeCompare(b));
});

const tabBarBottom = computed<boolean>(() => {
  return quasar.platform.has.touch;
});

function onAddExpense() {
  const campId = campDetailsStore.data?.id;
  if (!campId) {
    return;
  }

  quasar
    .dialog({
      component: ExpenseCreateDialog,
      componentProps: {
        people: people.value,
        categories: categories.value,
      },
      persistent: true,
    })
    .onOk((payload) => {
      // TODO Show loading and number once completed
      expensesStore.storeData(campId, payload);
    });
}
</script>

<i18n lang="yaml" locale="en">
tab:
  category: 'Category'
  overview: 'Overview'
  person: 'People'

panel:
  person: 'Expenses by person'
  category: 'Expense by category'
</i18n>

<i18n lang="yaml" locale="de">
tab:
  category: 'Kategorie'
  overview: 'Übersicht'
  person: 'Personen'

panel:
  person: 'Ausgaben nach Person'
  category: 'Ausgaben nach Kategorie'
</i18n>

<i18n lang="yaml" locale="fr">
tab:
  category: 'Catégorie'
  overview: 'Vue d’ensemble'
  person: 'Personnes'

panel:
  person: 'Dépenses par personne'
  category: 'Dépenses par catégorie'
</i18n>
