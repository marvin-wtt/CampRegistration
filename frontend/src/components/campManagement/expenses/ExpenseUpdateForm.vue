<template>
  <q-form
    class="q-pt-none q-gutter-y-sm column"
    @submit="onSubmit"
    @reset="onReset"
  >
    <q-input
      v-model="data.name"
      :label="t('field.name.label')"
      :rules="[(val?: string) => !!val || t('field.name.rule.required')]"
      hide-bottom-space
      collapsed
      outlined
      rounded
    >
      <template #prepend>
        <q-icon name="title" />
      </template>
    </q-input>

    <q-input
      v-model.number="data.receiptNumber"
      type="number"
      :label="t('field.receiptNumber.label')"
      :rules="[
        (val?: number) =>
          val == null ||
          (Number.isInteger(val) && val > 0) ||
          t('validation.receiptNumber.integer'),
      ]"
      hide-bottom-space
      clearable
      collapsed
      outlined
      rounded
    >
      <template #prepend>
        <q-icon name="title" />
      </template>
    </q-input>

    <autocomplete-input
      v-model="data.category"
      :label="t('field.category.label')"
      :options="categories"
      clearable
      outlined
      rounded
    >
      <template #prepend>
        <q-icon name="person" />
      </template>
    </autocomplete-input>

    <currency-input
      v-model="data.amount"
      :label="t('field.amount.label')"
      :rules="[(val?: number) => !!val || t('field.amount.rule.required')]"
      hide-bottom-space
      outlined
      rounded
    >
      <template #prepend>
        <q-icon name="euro" />
      </template>
    </currency-input>

    <!-- Date -->
    <q-input
      v-model="data.date"
      :label="t('field.date.label')"
      outlined
      rounded
    >
      <template #prepend>
        <q-icon name="calendar_month" />
      </template>
      <template #append>
        <q-icon
          name="event"
          class="cursor-pointer"
        >
          <q-popup-proxy
            cover
            transition-show="scale"
            transition-hide="scale"
          >
            <q-date
              v-model="data.date"
              mask="YYYY-MM-DD"
            >
              <div class="row items-center justify-end">
                <q-btn
                  v-close-popup
                  :label="t('action.close')"
                  color="primary"
                  flat
                  rounded
                />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>

    <q-input
      v-model="data.description"
      :label="t('field.description.label')"
      collapsed
      outlined
      rounded
      clearable
    >
      <template #prepend>
        <q-icon name="description" />
      </template>
    </q-input>

    <autocomplete-input
      v-model="data.paidBy"
      :label="t('field.paidBy.label')"
      :options="people"
      clearable
      outlined
      rounded
    >
      <template #prepend>
        <q-icon name="person" />
      </template>
    </autocomplete-input>

    <!-- paidAt -->
    <q-input
      v-if="data.paidBy"
      v-model="data.paidAt"
      :label="t('field.paidAt.label')"
      :rules="[(val?: number) => !!val || t('field.amount.paidAt.required')]"
      hide-bottom-space
      outlined
      rounded
    >
      <template #prepend>
        <q-icon name="calendar_month" />
      </template>
      <template #append>
        <q-icon
          name="event"
          class="cursor-pointer"
        >
          <q-popup-proxy
            cover
            transition-show="scale"
            transition-hide="scale"
          >
            <q-date
              v-model="data.paidAt"
              mask="YYYY-MM-DD"
            >
              <div class="row items-center justify-end">
                <q-btn
                  v-close-popup
                  :label="t('action.close')"
                  color="primary"
                  flat
                  rounded
                />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>

    <!-- recipient -->
    <q-input
      v-model="data.payee"
      :label="t('field.payee.label')"
      outlined
      rounded
    >
      <template #prepend>
        <q-icon name="arrow_forward" />
      </template>
    </q-input>

    <!-- file -->
    <q-file
      v-model="data.file"
      :label="t('field.file.label')"
      accept=".pdf, image/*"
      max-file-size="52428800"
      clearable
      outlined
      rounded
    >
      <template #prepend>
        <q-icon name="attach_file" />
      </template>

      <template
        v-if="!data.file && expense.file"
        #append
      >
        <q-btn
          icon="undo"
          size="xs"
          round
          flat
          @click="resetFile()"
        />
      </template>
    </q-file>

    <div class="row justify-end no-wrap">
      <q-btn
        :label="t('action.cancel')"
        type="reset"
        outline
        rounded
        color="primary"
      />
      <q-btn
        :label="t('action.save')"
        type="submit"
        rounded
        color="primary"
      />
    </div>
  </q-form>
</template>

<script lang="ts" setup>
import AutocompleteInput from 'components/common/inputs/AutocompleteInput.vue';
import CurrencyInput from 'components/common/inputs/CurrencyInput.vue';
import { useI18n } from 'vue-i18n';
import type {
  Expense,
  ExpenseUpdateData,
} from '@camp-registration/common/entities';
import { reactive, toRaw, watch } from 'vue';
import { useExpensesStore } from 'stores/expense-store.ts';
import { storeToRefs } from 'pinia';

const { t } = useI18n();
const expensesStore = useExpensesStore();
const { people, categories } = storeToRefs(expensesStore);

const props = defineProps<{
  expense: Expense;
}>();

const emit = defineEmits<{
  (e: 'edit', data: ExpenseUpdateData): void;
  (e: 'cancel'): void;
}>();

const data = reactive<ExpenseUpdateData>(initialData());

function initialData(): ExpenseUpdateData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, paidAt, date, file, ...others } = structuredClone(
    toRaw(props.expense),
  );
  const data: ExpenseUpdateData = others;

  if (date) {
    data.date = formatDateString(date);
  }

  if (paidAt) {
    data.paidAt = formatDateString(paidAt);
  }

  if (file) {
    data.file = new File([], file.name);
  }

  return data;
}

watch(
  () => data.paidBy,
  (value, oldValue) => {
    if (value == null) {
      // Reset when no one paid yet
      data.paidAt = null;
    } else if (oldValue == undefined && props.expense.paidAt) {
      // Use default
      data.paidAt = formatDateString(props.expense.paidAt);
    }
  },
);

function formatDateString(date: string): string {
  return date.split('T')[0];
}

function resetFile() {
  data.file = initialData().file;
}

function onSubmit(): void {
  emit('edit', data);
}

function onReset() {
  emit('cancel');
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
field:
  amount:
    label: 'Amount'
    rule:
      required: 'Amount is required'
  category:
    label: 'Category'
  date:
    label: 'Date'
  description:
    label: 'Description'
  file:
    label: 'Receipt'
  name:
    label: 'Name'
    rule:
      required: 'Name is required'
  paidAt:
    label: 'Payment date'
    rule:
      required: 'Paid at is required'
  paidBy:
    label: 'Paid by'
  payee:
    label: 'Payee'
  receiptNumber:
    label: 'Receipt Nr.'
    rule:
      integer: 'Receipt Nr. must be a positive integer'

action:
  close: 'Close'
  save: 'Save'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
field:
  amount:
    label: 'Betrag'
    rule:
      required: 'Betrag ist erforderlich'
  category:
    label: 'Kategorie'
  date:
    label: 'Datum'
  description:
    label: 'Beschreibung'
  file:
    label: 'Beleg'
  name:
    label: 'Name'
    rule:
      required: 'Name ist erforderlich'
  paidAt:
    label: 'Zahlungsdatum'
    rule:
      required: 'Zahlungsdatum ist erforderlich'
  paidBy:
    label: 'Bezahlt von'
  payee:
    label: 'Empfänger'
  receiptNumber:
    label: 'Beleg-Nr.'
    rule:
      integer: 'Beleg-Nr muss eine positive ganze Zahl sein'

action:
  close: 'Schließen'
  save: 'Speichern'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
field:
  amount:
    label: 'Montant'
    rule:
      required: 'Le montant est requis'
  category:
    label: 'Catégories'
  date:
    label: 'Date'
  description:
    label: 'Description'
  file:
    label: 'Reçu'
  name:
    label: 'Nom'
    rule:
      required: 'Le nom est requis'
  paidAt:
    label: 'Date de paiement'
    rule:
      required: 'La date de paiement est requise'
  paidBy:
    label: 'Payé par'
  payee:
    label: 'Bénéficiaire'
  receiptNumber:
    label: 'N° de reçu'
    rule:
      integer: 'N° de reçu doit être un nombre entier positif'

action:
  close: 'Fermer'
  save: 'Enregistrer'
  cancel: 'Annuler'
</i18n>
