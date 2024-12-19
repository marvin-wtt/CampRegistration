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

      <q-card-section :class="showFilePreview ? 'col-shrink' : 'col'">
        <expense-update-form
          v-if="edit"
          v-model="updatedExpense"
          :expense="props.expense"
        />

        <q-list
          v-else
          class="details-list"
        >
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
        v-if="showFilePreview && expense.file != null"
        class="col-grow relative-position overflow-hidden q-mr-sm"
      >
        <pdf-viewer
          v-if="expense.file.type === 'application/pdf'"
          :url="expense.file.url"
          class="file-viewer"
        />

        <image-viewer
          v-else-if="expense.file.type.startsWith('image')"
          :url="expense.file.url"
          class="file-viewer"
        />

        <iframe
          v-else
          :src="expense.file?.url"
          :title="expense.file?.name"
          class="file-viewer"
        />
      </q-card-section>

      <q-card-actions
        v-if="edit"
        align="center"
        class="col-12"
      >
        <q-btn
          :label="t('action.cancel')"
          color="primary"
          rounded
          outline
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('action.save')"
          color="primary"
          rounded
          @click="onSave"
        />
      </q-card-actions>

      <q-card-actions
        v-else
        align="center"
        class="col-12"
      >
        <q-btn
          :label="t('action.ok')"
          color="primary"
          rounded
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { Expense, ExpenseUpdateData } from '@camp-registration/common/entities';
import { exportFile, useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import ExpenseDetailsItem from 'components/campManagement/expenses/ExpenseDetailsItem.vue';
import { computed, ref, StyleValue } from 'vue';
import ExpenseUpdateForm from 'components/campManagement/expenses/ExpenseUpdateForm.vue';
import PdfViewer from 'components/PdfViewer.vue';
import ImageViewer from 'components/ImageViewer.vue';

const props = defineProps<{
  expense: Expense;
  edit?: boolean;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } =
  useDialogPluginComponent();
const { t, d, n } = useI18n();

const updatedExpense = ref<ExpenseUpdateData>({});

const showFilePreview = computed<boolean>(() => {
  return props.expense.file != null && quasar.screen.gt.sm;
});

const dialogStyle = computed<StyleValue>(() => {
  if (!showFilePreview.value) {
    return undefined;
  }

  return {
    width: '1000px',
    maxWidth: '80dvw',
  };
});

function downloadFile() {
  const file = props.expense.file;

  if (file == null || !showFilePreview.value) return;

  exportFile(file.name, file.url, {
    mimeType: file.type,
  });
}

function onSave() {
  onDialogOK(updatedExpense.value);
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
  cancel: 'Cancel'
  ok: 'Ok'
  save: 'Save'
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
  cancel: 'Abbrechen'
  ok: 'Ok'
  save: 'Speichern'
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
  cancel: 'Annuler'
  ok: 'Ok'
  save: 'Enregistrer'
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

.details-list {
  min-width: 250px;
}

.details-list > .q-item {
  min-height: 63px;
}
</style>
