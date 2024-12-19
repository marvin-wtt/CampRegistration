<template>
  <q-form class="q-pt-none q-gutter-y-sm column">
    <q-input
      v-model="model.name"
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
      v-model.number="model.receiptNumber"
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
      v-model="model.category"
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
      v-model="model.amount"
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
      v-model="model.date"
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
              v-model="model.date"
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
      v-model="model.description"
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
      v-model="model.paidBy"
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
      v-if="model.paidBy"
      v-model="model.paidAt"
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
              v-model="model.paidAt"
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
      v-model="model.payee"
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
      v-model="model.file"
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
        v-if="!model.file && expense.file"
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
import { toRaw, watch, defineModel } from 'vue';
import { useExpensesStore } from 'stores/expense-store.ts';
import { storeToRefs } from 'pinia';

const { t } = useI18n();
const expensesStore = useExpensesStore();
const { people, categories } = storeToRefs(expensesStore);

const model = defineModel<ExpenseUpdateData>({
  default: initialData(),
});

const props = defineProps<{
  expense: Expense;
}>();

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
  () => model.paidBy,
  (value, oldValue) => {
    if (value == null) {
      // Reset when no one paid yet
      model.paidAt = null;
    } else if (oldValue == undefined && props.expense.paidAt) {
      // Use default
      model.paidAt = formatDateString(props.expense.paidAt);
    }
  },
);

function formatDateString(date: string): string {
  return date.split('T')[0];
}

function resetFile() {
  model.file = initialData().file;
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
</i18n>
