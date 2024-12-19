<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-form
        @submit="onOKClick"
        @reset="onCancelClick"
      >
        <q-card-section>
          <div class="text-h6 text-center">
            {{ t(`title`) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
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
            v-model="data.category"
            :label="t('field.category.label')"
            :rules="[
              (val?: string) => !!val || t('field.name.category.required'),
            ]"
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
            :rules="[
              (val?: number) => !!val || t('field.amount.rule.required'),
            ]"
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
            :rules="[
              (val?: number) => !!val || t('field.amount.paidAt.required'),
            ]"
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
          </q-file>

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
        </q-card-section>

        <!-- action buttons -->
        <q-card-actions align="right">
          <q-btn
            type="reset"
            outline
            rounded
            color="primary"
            :label="t('action.cancel')"
          />
          <q-btn
            type="submit"
            rounded
            color="primary"
            :label="t('action.save')"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { reactive, watch } from 'vue';
import type { ExpenseCreateData } from '@camp-registration/common/entities';
import CurrencyInput from 'components/common/inputs/CurrencyInput.vue';
import AutocompleteInput from 'components/common/inputs/AutocompleteInput.vue';
import { useExpensesStore } from 'stores/expense-store.ts';
import { storeToRefs } from 'pinia';

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const expensesStore = useExpensesStore();
const { people, categories } = storeToRefs(expensesStore);

const data = reactive<Partial<ExpenseCreateData>>({
  date: currentDate(),
});

watch(
  () => data.paidBy,
  (value, oldValue) => {
    if (value == undefined) {
      // Reset when no one paid yet
      data.paidAt = undefined;
    } else if (oldValue == undefined) {
      // Use now as default
      data.paidAt = currentDate();
    }
  },
);

function currentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function onOKClick(): void {
  expensesStore.storeData(data as ExpenseCreateData);
  onDialogOK();
}

function onCancelClick() {
  onDialogCancel();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Add expense'

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
  save: 'Save'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Ausgabe hinzufügen'

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
  save: 'Speichern'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Ajouter une dépense'

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
  save: 'Enregistrer'
  cancel: 'Annuler'
</i18n>

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
