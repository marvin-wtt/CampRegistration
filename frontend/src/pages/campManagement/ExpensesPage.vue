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
            clearable
            rounded
            outlined
            class="col-12"
            style="max-width: 300px"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>
                    {{ scope.opt.label }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ t(`category.${scope.opt.type}`) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <template #prepend>
              <q-icon name="sell" />
            </template>
          </q-select>

          <q-select
            v-model="filter.paidBy"
            :label="t('filter.paidBy')"
            :options="paidByOptions"
            multiple
            clearable
            rounded
            outlined
            class="col-12"
            style="max-width: 300px"
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-select>

          <q-select
            v-model="filter.status"
            :label="t('filter.status')"
            :options="statusOptions"
            emit-value
            map-options
            multiple
            clearable
            rounded
            outlined
            class="col-12 no-wrap"
            style="max-width: 300px"
          >
            <template #prepend>
              <q-icon name="tune" />
            </template>
          </q-select>
        </div>

        <!-- Title and total -->
        <div class="row justify-center">
          <div class="col-xs-12 col-sm-11 col-md-8 col-lg-6 col-xl-4 column">
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label class="text-h5">{{ t('title') }}:</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label class="text-h5 text-bold">
                    {{ n(filteredTotal, 'currency') }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    icon="download"
                    :disable="expenses.length === 0"
                    outline
                    round
                    dense
                    flat
                    @click="onExport"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </div>

      <expenses-list-panel
        class="col-grow q-pt-sm"
        :expenses="filteredExpenses"
        :loading
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
import { type QSelectOption, useQuasar } from 'quasar';
import { computed, onMounted, reactive, ref } from 'vue';
import type {
  Expense,
  ExpenseCreateData,
  ExpenseUpdateData,
} from '@camp-registration/common/entities';
import ExpensesListPanel from 'components/campManagement/expenses/ExpensesListPanel.vue';
import ExpenseCreateDialog from 'components/campManagement/expenses/ExpenseCreateDialog.vue';
import { useExpensesStore } from 'stores/expense-store';
import { useCampDetailsStore } from 'stores/camp-details-store';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import ExpenseDetailsDialog from 'components/campManagement/expenses/ExpenseDetailsDialog.vue';
import ExpenseUpdateDialog from 'components/campManagement/expenses/ExpenseUpdateDialog.vue';
import { storeToRefs } from 'pinia';
import type { ExpenseCategory } from 'components/campManagement/expenses/ExpenseCategory';
import { useExpenseCategories } from 'src/composables/expenseCategories';

const { t, n } = useI18n();
const quasar = useQuasar();
const expensesStore = useExpensesStore();
const { people } = storeToRefs(expensesStore);
const campDetailsStore = useCampDetailsStore();
const { categories } = useExpenseCategories();

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
  status?: 'unpaid' | 'noReceipt' | null;
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
    if (filter.status?.includes('unpaid') && expense.paidAt != null) {
      return false;
    }

    if (filter.status?.includes('noReceipt') && expense.file != null) {
      return false;
    }

    return true;
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

const categoryOptions = computed<ExpenseCategory[]>(() => {
  return categories.value;
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

const statusOptions = computed<QSelectOption<Filter['status']>[]>(() => {
  return [
    {
      label: t('statusOptions.unpaid'),
      value: 'unpaid',
    },
    {
      label: t('statusOptions.noReceipt'),
      value: 'noReceipt',
    },
  ];
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
      },
    })
    .onOk((data: ExpenseCreateData) => {
      expensesStore.createData(data);
    });
}

function onEditExpense(expense: Expense) {
  quasar
    .dialog({
      component: ExpenseUpdateDialog,
      componentProps: {
        expense,
        categories: categories.value,
        people: people.value,
      },
    })
    .onOk((data: ExpenseUpdateData) => {
      // Only send file when modified
      if (data.file?.lastModified === -1) {
        delete data.file;
      }

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

function onExport() {
  expensesStore.exportData('excel-fgyp');
}
</script>

<style lang="scss" scoped></style>

<i18n lang="yaml" locale="en">
title: 'Total'

action:
  cancel: 'Cancel'
  delete: 'Delete'
  ok: 'Ok'

category:
  income: 'Income'
  expense: 'Expense'

dialog:
  delete:
    title: 'Delete expense "{ name }"?'
    message: 'Are you sure you want to delete this expense permanently?'

filter:
  categories: 'Categories'
  paidBy: 'Paid By'
  status: 'Status'

statusOptions:
  unpaid: 'Unpaid'
  noReceipt: 'No receipt'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Gesamt'

action:
  cancel: 'Abbrechen'
  delete: 'Löschen'
  ok: 'Ok'

category:
  income: 'Einnahme'
  expense: 'Ausgabe'

dialog:
  delete:
    title: 'Ausgabe "{ name }" löschen?'
    message: 'Möchtest du diese Ausgabe wirklich permanent löschen?'

filter:
  categories: 'Kategorien'
  paidBy: 'Bezahlt von'
  status: 'Status'

statusOptions:
  unpaid: 'Unbezahlt'
  noReceipt: 'Kein Beleg'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Total'

action:
  cancel: 'Annuler'
  delete: 'Supprimer'
  ok: 'Ok'

category:
  income: 'Revenu'
  expense: 'Dépense'

dialog:
  delete:
    title: 'Supprimer dépense "{ name }" ?'
    message: 'Voulez-vous vraiment supprimer cette dépense définitivement ?'

filter:
  categories: 'Catégories'
  paidBy: 'Payé par'
  status: 'Statut'

statusOptions:
  unpaid: 'Non payé'
  noReceipt: 'Pas de reçu'
</i18n>
