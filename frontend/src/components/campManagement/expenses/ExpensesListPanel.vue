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

      <!-- TODO Skeleton and no entries -->

      <q-list separator>
        <!-- TODO Add payment status -->
        <q-item
          v-for="expense in props.expenses"
          :key="expense.id"
          clickable
        >
          <q-item-section avatar>
            <q-avatar>
              {{ expense.receiptNumber ?? '-' }}
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>
              {{ expense.name }}
            </q-item-label>
            <q-item-label caption>
              {{ d(expense.date, 'short') }} &middot;
              {{ expense?.category ?? '-' }}
            </q-item-label>
          </q-item-section>

          <q-item-section
            class="text-bold"
            side
          >
            {{ n(expense.amount, 'currency') }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-tab-panel>
</template>

<script lang="ts" setup>
import { Expense } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';

const { t, d, n } = useI18n();

const props = defineProps<{
  name: string;
  expenses: Expense[];
}>();
</script>

<i18n lang="yaml" locale="en">
title: 'Expenses'

items: '{count} item | {count} items'
</i18n>

<style scoped></style>
