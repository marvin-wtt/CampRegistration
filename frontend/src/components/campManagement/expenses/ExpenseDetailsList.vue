<template>
  <q-list class="details-list">
    <expense-details-item
      :label="t('expense.name')"
      :value="props.expense.name ?? '-'"
    />

    <expense-details-item
      :label="t('expense.receiptNumber')"
      :value="props.expense.receiptNumber ?? '-'"
    />

    <expense-details-item
      :label="t('expense.category')"
      :value="props.expense.category ?? '-'"
    />

    <expense-details-item
      :label="t('expense.amount')"
      :value="n(props.expense.amount, 'currency')"
    />

    <expense-details-item
      v-if="props.expense.date"
      :label="t('expense.date')"
      :value="props.expense.date ? d(props.expense.date, 'short') : '-'"
    />

    <expense-details-item
      :label="t('expense.description')"
      :value="props.expense.description ?? '-'"
    />

    <expense-details-item
      :label="t('expense.paidBy')"
      :value="props.expense.paidBy ?? '-'"
    />

    <expense-details-item
      :label="t('expense.paidAt')"
      :value="props.expense.paidAt ? d(props.expense.paidAt, 'short') : '-'"
    />

    <expense-details-item
      :label="t('expense.payee')"
      :value="props.expense.payee ?? '-'"
    />

    <expense-details-item
      :label="t('expense.file')"
      :value="expense.file?.name ?? '-'"
    >
      <q-item-section side>
        <q-btn
          icon="download"
          round
          flat
          @click="downloadFile"
        />
      </q-item-section>
    </expense-details-item>
  </q-list>
</template>

<script lang="ts" setup>
import ExpenseDetailsItem from 'components/campManagement/expenses/ExpenseDetailsItem.vue';
import { useI18n } from 'vue-i18n';
import type { Expense } from '@camp-registration/common/entities';
import { exportFile } from 'quasar';
import { useAPIService } from 'src/services/APIService.ts';

const { t, d, n } = useI18n();
const api = useAPIService();

const props = defineProps<{
  expense: Expense;
}>();

async function downloadFile() {
  const file = props.expense.file;

  if (file == null) {
    return;
  }

  const data = await api.downloadFile(file.url);

  exportFile(file.name, data, {
    mimeType: file.type,
  });
}
</script>

<style scoped>
.details-list {
  min-width: 250px;
}

.details-list > .q-item {
  min-height: 63px;
}
</style>

<i18n lang="yaml" locale="en">
expense:
  amount: 'Amount'
  category: 'Category'
  date: 'Date'
  description: 'Description'
  file: 'File'
  name: 'Name'
  paidAt: 'Payment date'
  paidBy: 'Paid by'
  payee: 'Payee'
  receiptNumber: 'Receipt Nr.'
</i18n>

<i18n lang="yaml" locale="de">
expense:
  amount: 'Betrag'
  category: 'Kategorie'
  date: 'Datum'
  description: 'Beschreibung'
  file: 'Datei'
  name: 'Name'
  paidAt: 'Zahlungsdatum'
  paidBy: 'Bezahlt von'
  payee: 'Empfänger'
  receiptNumber: 'Beleg-Nr.'
</i18n>

<i18n lang="yaml" locale="fr">
expense:
  amount: 'Montant'
  category: 'Catégorie'
  date: 'Date'
  description: 'Description'
  file: 'Fiche'
  name: 'Nom'
  paidAt: 'Date de paiement'
  paidBy: 'Payé par'
  payee: 'Bénéficiaire'
  receiptNumber: 'Numéro de reçu'
</i18n>
