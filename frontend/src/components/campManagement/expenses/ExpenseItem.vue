<template>
  <!-- TODO Add payment status -->
  <q-item clickable>
    <q-item-section avatar>
      <q-avatar>
        {{ props.expense.receiptNumber ?? '-' }}
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label>
        {{ props.expense.name }}
      </q-item-label>
      <q-item-label caption>
        {{ d(props.expense.date, 'short') }} &middot;
        {{ props.expense?.category ?? '-' }}
      </q-item-label>
    </q-item-section>

    <q-item-section
      class="text-bold"
      side
    >
      {{ n(props.expense.amount, 'currency') }}
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { Expense } from '@camp-registration/common/entities';

const { d, n } = useI18n();

const props = defineProps<{
  expense: Expense;
}>();
</script>

<style scoped></style>
