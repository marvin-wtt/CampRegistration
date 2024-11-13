<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card
      class="q-dialog-plugin q-pb-none row"
      :style="dialogStyle"
    >
      <q-card-section class="text-h5 text-center col-12">
        {{ t('title') }}
      </q-card-section>
      <q-card-section class="col-shrink">
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
            :label="t('expense.category')"
            :value="props.expense.category ?? '-'"
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
            :label="t('expense.amount')"
            :value="n(props.expense.amount, 'currency')"
          />

          <expense-details-item
            :label="t('expense.paidBy')"
            :value="props.expense.paidBy ?? '-'"
          />

          <expense-details-item
            :label="t('expense.paidAt')"
            :value="
              props.expense.paidAt ? d(props.expense.paidAt, 'short') : '-'
            "
          />

          <expense-details-item
            :label="t('expense.payee')"
            :value="props.expense.payee ?? '-'"
          />

          <expense-details-item
            :label="t('expense.file')"
            :value="expense.file?.name ?? '-'"
            :clickable="!showFilePreview"
            @click="downloadFile"
          />
        </q-list>
      </q-card-section>

      <q-card-section
        v-if="showFilePreview"
        class="col-grow relative-position overflow-hidden"
      >
        <iframe
          :src="expense.file?.url"
          :title="expense.file?.name"
          class="file-viewer"
        />
      </q-card-section>

      <q-card-actions
        align="center"
        class="col-12"
      >
        <q-btn
          :label="t('action.ok')"
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
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import ExpenseDetailsItem from 'components/campManagement/expenses/ExpenseDetailsItem.vue';
import { computed, StyleValue } from 'vue';

const props = defineProps<{
  expense: Expense;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const { t, d, n } = useI18n();

const showFilePreview = computed<boolean>(() => {
  return !!props.expense.file && quasar.screen.gt.sm;
});

const dialogStyle = computed<StyleValue>(() => {
  if (!showFilePreview.value) {
    return undefined;
  }

  return {
    width: '1000px',
    maxWidth: '80vw',
  };
});

function downloadFile() {
  if (!showFilePreview.value) return;
  // TODO
}
</script>

<i18n lang="yaml" locale="en">
title: 'Details'

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
  file: 'Datei'
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
  file: 'Fiche'
  name: 'Nom'
  paidAt: 'Date de paiement'
  paidBy: 'Payé par'
  payee: 'Bénéficiaire'
  receiptNumber: 'Numéro de reçu'

action:
  ok: 'Ok'
</i18n>

<style scoped>
.file-viewer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  border: none;
}
</style>
