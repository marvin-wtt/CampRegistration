<template>
  <page-state-handler
    :error
    class="column"
  >
    <div class="absolute fit column no-wrap">
      <div class="shadow-3">
        <!-- Filter control -->
        <div
          v-if="denseFilter"
          class="row justify-between reverse q-pa-md"
        >
          <q-btn
            v-if="!showFilter"
            aria-label="Open filter"
            icon="tune"
            color="primary"
            rounded
            @click="showFilter = true"
          />
          <q-btn
            v-else
            aria-label="Close filter"
            icon="check"
            color="primary"
            rounded
            @click="showFilter = false"
          />
        </div>

        <!-- Filter -->
        <div
          v-if="showFilter || !denseFilter"
          class="row wrap justify-center q-gutter-sm q-pa-sm"
        >
          <q-select
            v-model="filter.categories"
            :label="t('filter.categories')"
            :options="categoryOptions"
            emit-value
            map-options
            multiple
            rounded
            outlined
            clearable
            class="col-12"
            style="max-width: 300px"
          >
            <template #prepend>
              <q-icon name="sell" />
            </template>
          </q-select>

          <q-select
            v-model="filter.paidBy"
            :label="t('filter.paidBy')"
            :options="paidByOptions"
            multiple
            rounded
            outlined
            clearable
            class="col-12"
            style="max-width: 300px"
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-select>
        </div>

        <!-- Title and total -->
        <div class="row justify-center">
          <div class="col-xs-12 col-sm-11 col-md-8 col-lg-6 col-xl-4 column">
            <div class="row justify-between text-h6 q-pa-sm">
              <a> {{ t('title') }}:</a>
              <a>{{ n(filteredTotal, 'currency') }}</a>
            </div>
          </div>
        </div>
      </div>

      <expenses-list-panel
        class="col-grow q-pt-sm"
        :expenses="filteredExpenses"
        :loading="loading"
        @show="onShowExpense"
        @edit="onEditExpense"
        @delete="onDeleteExpense"
      />
    </div>
    <q-page-sticky
      v-if="campDetailsStore.data"
      position="bottom-right"
      :offset="[18, 18]"
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
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { QSelectOption, useQuasar } from 'quasar';
import { computed, onMounted, reactive, ref } from 'vue';
import { Expense, ExpenseUpdateData } from '@camp-registration/common/entities';
import ExpensesListPanel from 'components/campManagement/expenses/ExpensesListPanel.vue';
import ExpenseCreateDialog from 'components/campManagement/expenses/ExpenseCreateDialog.vue';
import { useExpensesStore } from 'stores/expense-store.ts';
import { useCampDetailsStore } from 'stores/camp-details-store.ts';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import ExpenseDetailsDialog from 'components/campManagement/expenses/ExpenseDetailsDialog.vue';

const { t, n } = useI18n();
const quasar = useQuasar();
const expensesStore = useExpensesStore();
const campDetailsStore = useCampDetailsStore();

onMounted(() => {
  campDetailsStore.fetchData();
  expensesStore.fetchData();
});

const error = computed<string | null>(() => {
  return campDetailsStore.error || expensesStore.error;
});

const loading = computed<boolean>(() => {
  return expensesStore.isLoading;
});

interface Filter {
  categories?: string[] | null;
  paidBy?: string[] | null;
  paymentStatus?: 'paid' | 'unpaid' | null;
}

const filter = reactive<Filter>({});
const showFilter = ref<boolean>(false);

const denseFilter = computed<boolean>(() => {
  return quasar.screen.lt.sm;
});

const expenses = computed<Expense[]>(() => {
  if (!expensesStore.data) {
    return [];
  }

  return expensesStore.data
    .toSorted((a, b) => (a.receiptNumber ?? 0) - (b.receiptNumber ?? 0))
    .reverse();
});

const filteredExpenses = computed<Expense[]>(() => {
  const categoryFilter = (expense: Expense): boolean => {
    if (filter.categories == null) {
      return true;
    }

    return filter.categories.includes(expense.category);
  };

  const paidByFilter = (expense: Expense): boolean => {
    if (filter.paidBy == null) {
      return true;
    }

    return expense.paidBy != null && filter.paidBy.includes(expense.paidBy);
  };

  const statusFilter = (expense: Expense): boolean => {
    return true; // TODO
  };

  return expenses.value
    .filter(categoryFilter)
    .filter(paidByFilter)
    .filter(statusFilter);
});

const filteredTotal = computed<number>(() => {
  return filteredExpenses.value.reduce(
    (total, expense) => total + expense.amount,
    0,
  );
});

const categoryOptions = computed<QSelectOption[]>(() => {
  return [];
});

const paidByOptions = computed<string[]>(() => {
  if (!expensesStore.data) {
    return [];
  }

  const names = expensesStore.data
    .map((expense) => expense.paidBy)
    .filter((name) => name != null);

  return [...new Set(names)].toSorted();
});

function onAddExpense() {
  const campId = campDetailsStore.data?.id;
  if (!campId) {
    return;
  }

  quasar.dialog({
    component: ExpenseCreateDialog,
    persistent: true,
  });
}

function onEditExpense(expense: Expense) {
  quasar
    .dialog({
      component: ExpenseDetailsDialog,
      componentProps: {
        expense,
        edit: true,
      },
    })
    .onOk((data: ExpenseUpdateData) => {
      expensesStore.updateData(expense.id, data);
    });
}

function onDeleteExpense(expense: Expense) {
  quasar
    .dialog({
      title: t('dialog.delete.title', { name: expense.name }),
      message: t('dialog.delete.message'),
      ok: {
        label: t('action.delete'),
        rounded: true,
        color: 'negative',
      },
      cancel: {
        label: t('action.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
    })
    .onOk(() => {
      expensesStore.deleteData(expense.id);
    });
}

function onShowExpense(expense: Expense) {
  quasar.dialog({
    component: ExpenseDetailsDialog,
    componentProps: {
      expense,
    },
  });
}
</script>

<style lang="scss" scoped></style>

<i18n lang="yaml" locale="en">
title: 'Expenses'

action:
  cancel: 'Cancel'
  delete: 'Delete'
  ok: 'Ok'

dialog:
  delete:
    title: 'Delete expense "{ name }"?'
    message: 'Are you sure you want to delete this expense permanently?'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Ausgaben'

action:
  cancel: 'Abbrechen'
  delete: 'Löschen'
  ok: 'Ok'

dialog:
  delete:
    title: 'Ausgabe "{ name }" löschen?'
    message: 'Möchtest du diese Ausgabe wirklich permanent löschen?'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Dépenses'

action:
  cancel: 'Annuler'
  delete: 'Supprimer'
  ok: 'Ok'

dialog:
  delete:
    title: 'Supprimer dépense "{ name }" ?'
    message: 'Voulez-vous vraiment supprimer cette dépense définitivement ?'
</i18n>
