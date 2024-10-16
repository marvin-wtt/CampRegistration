<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-card-section class="text-h5 text-center">
        {{ t('title') }}
      </q-card-section>
      <q-card-section>
        <q-list>
          <expense-details-item
            :label="t('expense.name')"
            :value="props.expense.name ?? '-'"
          />

          <expense-details-item
            :label="t('expense.receiptNumber')"
            :value="props.expense.receiptNumber ?? '-'"
          />

          <expense-details-item
            :label="t('expense.description')"
            :value="props.expense.description ?? '-'"
          />

          <expense-details-item
            :label="t('expense.category')"
            :value="props.expense.category ?? '-'"
          />

          <expense-details-item
            :label="t('expense.amount')"
            :value="props.expense.amount"
          />

          <expense-details-item
            :label="t('expense.date')"
            :value="props.expense.date ? d(props.expense.date, 'short') : '-'"
          />

          <expense-details-item
            :label="t('expense.paidAt')"
            :value="
              props.expense.paidAt ? d(props.expense.paidAt, 'short') : '-'
            "
          />

          <expense-details-item
            :label="t('expense.paidBy')"
            :value="props.expense.paidBy ?? '-'"
          />

          <expense-details-item
            :label="t('expense.payee')"
            :value="props.expense.payee ?? '-'"
          />

          <!-- TODO Show file -->
        </q-list>
      </q-card-section>

      <!-- action buttons -->
      <q-card-actions align="center">
        <q-btn
          :label="t('action.ok')"
          type="submit"
          rounded
          color="primary"
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { Expense } from '@camp-registration/common/entities';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import ExpenseDetailsItem from 'components/campManagement/expenses/ExpenseDetailsItem.vue';

const props = defineProps<{
  expense: Expense;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const { t, d } = useI18n();
</script>

<i18n lang="yaml" locale="en">
title: 'Details'

expense:
  amount: 'Amount'
  category: 'Category'
  date: 'Date'
  description: 'Description'
  name: 'Name'
  paidAt: 'Payment date'
  paidBy: 'Paid by'
  payee: 'Payee'
  receiptNumber: 'Receipt Nr.'

action:
  ok: 'Ok'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Details'

expense:
  amount: 'Betrag'
  category: 'Kategorie'
  date: 'Datum'
  description: 'Beschreibung'
  name: 'Name'
  paidAt: 'Zahlungsdatum'
  paidBy: 'Bezahlt von'
  payee: 'Empfänger'
  receiptNumber: 'Beleg-Nr.'

action:
  ok: 'Ok'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Détails'

expense:
  amount: 'Montant'
  category: 'Catégorie'
  date: 'Date'
  description: 'Description'
  name: 'Nom'
  paidAt: 'Date de paiement'
  paidBy: 'Payé par'
  payee: 'Bénéficiaire'
  receiptNumber: 'Numéro de reçu'

action:
  ok: 'Ok'
</i18n>

<style scoped></style>
