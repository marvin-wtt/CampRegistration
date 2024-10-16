<template>
  <!-- TODO Add payment status -->
  <q-item
    clickable
    @click="onItemClick"
  >
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
        {{ d(props.expense.date, 'short') }}
        <template v-if="props.expense?.category">
          &middot;
          {{ props.expense.category }}
        </template>
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
import { useQuasar } from 'quasar';
import ExpenseDetailsDialog from 'components/campManagement/expenses/ExpenseDetailsDialog.vue';

const { d, n } = useI18n();
const quasar = useQuasar();

const props = defineProps<{
  expense: Expense;
}>();

function onItemClick() {
  quasar.dialog({
    component: ExpenseDetailsDialog,
    componentProps: {
      expense: props.expense,
    },
  });
}
</script>

<style scoped></style>
