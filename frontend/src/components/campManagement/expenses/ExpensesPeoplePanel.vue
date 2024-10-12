<template>
  <!-- TODO Try to avoid absolute -->
  <q-tab-panel
    class="absolute"
    :name="props.name"
  >
    <q-scroll-area class="fit row">
      <div class="text-h6 q-pa-sm">
        {{ t('title') }}
      </div>

      <q-list separator>
        <q-item
          v-for="spending in spendingsPerPerson"
          :key="spending.name"
        >
          <q-item-section>
            <q-item-label>
              {{ spending.name }}
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
    </q-scroll-area>
  </q-tab-panel>
</template>

<script lang="ts" setup>
import { Expense } from '@camp-registration/common/entities';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, n } = useI18n();

const props = defineProps<{
  name: string;
  expenses: Expense[];
}>();

interface Spending {
  name: string;
  amount: number;
  expenses: Expense[];
}

const spendingsPerPerson = computed<Spending[]>(() => {
  const groupedSpendings = props.expenses.reduce(
    (acc, expense) => {
      const person = expense.paidBy ?? t('unknown');

      if (!(person in acc)) {
        acc[person] = {
          name: person,
          amount: 0,
          expenses: [],
        };
      }

      acc[person].amount += expense.amount;
      acc[person].expenses.push(expense);

      return acc;
    },
    {} as Record<string, Spending>,
  );

  return Object.values(groupedSpendings).toSorted((a, b) =>
    a.name.localeCompare(b.name),
  );
});

// TODO i18n
</script>

<i18n lang="yaml" locale="en">
title: 'Expenses per person'

items: '{count} item | {count} items'

unknown: 'Unknown'
</i18n>

<style scoped></style>
