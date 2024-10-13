<template>
  <q-tab-panel :name="props.name">
    <q-scroll-area class="fit">
      <div class="row justify-center">
        <div class="col-xs-12 col-sm-11 col-md-8 col-lg-6 col-xl-4 column">
          <div
            v-if="props.title"
            class="text-h6 q-pa-sm"
          >
            {{ props.title }}
          </div>
          <!-- Loading -->
          <q-list
            v-if="props.expenses == undefined"
            separator
          >
            <q-item
              v-for="i in 5"
              :key="i"
            >
              <q-item-section>
                <q-item-label>
                  <q-skeleton
                    type="text"
                    style="width: 150px"
                  />
                </q-item-label>
                <q-item-label caption>
                  <q-skeleton
                    type="text"
                    style="width: 100px"
                  />
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-skeleton
                  type="text"
                  style="width: 50px"
                />
              </q-item-section>
            </q-item>
          </q-list>

          <!-- No data -->
          <q-list v-else-if="props.expenses.length === 0">
            <q-item>
              <q-item-section class="text-center text-italic">
                <q-item-label>
                  {{ t('noData.line1') }}
                </q-item-label>
                <q-item-label caption>
                  {{ t('noData.line2') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Content -->
          <q-list
            v-else
            separator
          >
            <q-item
              v-for="spending in perPerson"
              :key="spending.label"
              clickable
              @click="onItemClick(spending)"
            >
              <q-item-section>
                <q-item-label>
                  {{ spending.label }}
                </q-item-label>
                <q-item-label caption>
                  {{ t('items', spending.expenses.length) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                {{ n(spending.amount, 'currency') }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </q-scroll-area>
  </q-tab-panel>
</template>

<script lang="ts" setup>
import { Expense } from '@camp-registration/common/entities';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import ExpenseGroupDialog from 'components/campManagement/expenses/ExpenseGroupDialog.vue';

const quasar = useQuasar();
const { t, n } = useI18n();

const props = defineProps<{
  title?: string;
  name: string;
  groupBy: keyof Pick<Expense, 'category' | 'paidBy'>;
  expenses: Expense[] | undefined;
}>();

interface Spending {
  label: string;
  amount: number;
  expenses: Expense[];
}

const perPerson = computed<Spending[]>(() => {
  if (!props.expenses) {
    return [];
  }

  const groupedExpenses = props.expenses.reduce(
    (acc, expense) => {
      const label = expense[props.groupBy] ?? t('unknown');

      if (!(label in acc)) {
        acc[label] = {
          label,
          amount: 0,
          expenses: [],
        };
      }

      acc[label].amount += expense.amount;
      acc[label].expenses.push(expense);

      return acc;
    },
    {} as Record<string, Spending>,
  );

  return Object.values(groupedExpenses).toSorted((a, b) =>
    a.label.localeCompare(b.label),
  );
});

function onItemClick({ label, expenses }: Spending) {
  quasar.dialog({
    component: ExpenseGroupDialog,
    componentProps: {
      label,
      expenses,
    },
  });
}
</script>

<i18n lang="yaml" locale="en">
items: '{count} expense | {count} expenses'

noData:
  line1: 'There are no expenses yet.'
  line2: 'Add a new expense by pressing the "+" button.'

unknown: 'Unknown'
</i18n>

<i18n lang="yaml" locale="de">
items: '{count} Ausgabe | {count} Ausgaben'

noData:
  line1: 'Es gibt noch keine Ausgaben.'
  line2: 'Füge eine neue Ausgabe hinzu, indem du auf die "+"-Schaltfläche drückst.'

unknown: 'Unbekannt'
</i18n>

<i18n lang="yaml" locale="fr">
items: '{count} dépense | {count} dépenses'

noData:
  line1: "Il n'y a pas encore de dépenses."
  line2: 'Ajoute une nouvelle dépense en appuyant sur le bouton "+".'

unknown: 'Inconnu'
</i18n>

<style scoped></style>
