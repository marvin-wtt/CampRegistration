<template>
  <div class="q-pt-none q-gutter-y-sm column">
    <!-- file -->
    <q-file
      v-model="model.file"
      :label="t('field.file.label')"
      accept=".pdf, image/*"
      capture="environment"
      max-file-size="52428800"
      clearable
      outlined
      rounded
    >
      <template #prepend>
        <q-icon name="attach_file" />
      </template>
    </q-file>

    <!-- Name -->
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

    <expense-category-select
      v-model="model.category"
      :label="t('field.category.label')"
      :rules="[(val?: string) => !!val || t('field.category.rule.required')]"
      hide-bottom-space
      :options="props.categories"
      clearable
      outlined
      rounded
    >
      <template #prepend>
        <q-icon name="person" />
      </template>
    </expense-category-select>

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

    <autocomplete-input
      v-model="model.paidBy"
      :label="t('field.paidBy.label')"
      :options="props.people"
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
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { defineModel, watch } from 'vue';
import type { ExpenseCreateData } from '@camp-registration/common/entities';
import CurrencyInput from 'components/common/inputs/CurrencyInput.vue';
import AutocompleteInput from 'components/common/inputs/AutocompleteInput.vue';
import ExpenseCategorySelect from 'components/campManagement/expenses/ExpenseCategorySelect.vue';
import type { ExpenseCategory } from 'components/campManagement/expenses/ExpenseCategory.ts';

const { t } = useI18n();

const model = defineModel<Partial<ExpenseCreateData>>({
  default: {
    date: new Date().toISOString().split('T')[0],
  },
});

const props = defineProps<{
  people: string[];
  categories: ExpenseCategory[];
}>();

watch(
  () => model.value.paidBy,
  (value, oldValue) => {
    if (value == undefined) {
      // Reset when no one paid yet
      model.value.paidAt = null;
    } else if (oldValue == undefined) {
      // Use now as default
      model.value.paidAt = currentDate();
    }
  },
);

function currentDate(): string {
  return new Date().toISOString().split('T')[0];
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
    rule:
      required: 'Category is required'
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
    rule:
      required: 'Kategorie ist erforderlich'
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
    label: 'Catégorie'
    rule:
      required: 'La catégorie est requis'
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

action:
  close: 'Fermer'
</i18n>

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
