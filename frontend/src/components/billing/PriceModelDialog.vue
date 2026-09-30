<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="price-model-card">
      <q-form @submit="onSubmit">
        <q-card-section class="q-pb-none">
          <div class="text-h6">
            {{ priceModel ? t('title.edit') : t('title.create') }}
          </div>
        </q-card-section>

        <q-card-section class="price-model-fields">
          <translated-input
            v-model="name"
            :label="t('field.name')"
            :rules="[requiredName]"
            :locales="APP_LOCALES"
            class="span-2"
            maxlength="255"
            hide-bottom-space
            color="primary"
            outlined
            rounded
          />

          <q-select
            v-model="currency"
            :options="currencyOptions"
            :label="t('field.currency')"
            options-selected-class=""
            emit-value
            map-options
            hide-bottom-space
            color="primary"
            outlined
            rounded
          />

          <q-input
            v-model.number="taxRate"
            :label="t('field.taxRate')"
            :rules="[percent]"
            type="number"
            min="0"
            max="100"
            step="0.01"
            suffix="%"
            hide-bottom-space
            color="primary"
            outlined
            rounded
          />

          <q-input
            v-model.number="pricePerRegistration"
            :label="t('field.pricePerRegistration')"
            :rules="[required, nonNegative]"
            :suffix="currency"
            type="number"
            min="0"
            step="0.01"
            hide-bottom-space
            color="primary"
            outlined
            rounded
          />

          <q-input
            v-model.number="baseFee"
            :label="t('field.baseFee')"
            :rules="[nonNegative]"
            :suffix="currency"
            type="number"
            min="0"
            step="0.01"
            hide-bottom-space
            color="primary"
            outlined
            rounded
          />

          <div class="span-2 text-caption text-on-surface-variant">
            {{ t('hint') }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            :label="t('action.cancel')"
            flat
            rounded
            no-caps
            color="primary"
            @click="onDialogCancel"
          />
          <q-btn
            :label="t('action.save')"
            type="submit"
            color="primary"
            unelevated
            rounded
            no-caps
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import {
  PRICE_MODEL_CURRENCIES,
  type PriceModel,
  type PriceModelCreateData,
  type PriceModelCurrency,
  type Translatable,
} from '@camp-registration/common/entities';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import { APP_LOCALES } from '@/i18n/locales';

const { priceModel = null } = defineProps<{
  priceModel?: PriceModel | null;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

const name = ref<Translatable | undefined>(priceModel?.name);
const currency = ref<PriceModelCurrency>(priceModel?.currency ?? 'EUR');
const pricePerRegistration = ref<number | string>(
  priceModel ? Number(priceModel.pricePerRegistration) : 0,
);
const baseFee = ref<number | string>(
  priceModel ? Number(priceModel.baseFee) : 0,
);
const taxRate = ref<number | string>(
  priceModel ? Number(priceModel.taxRate) : 0,
);

const currencyOptions = PRICE_MODEL_CURRENCIES.map((code) => ({
  label: code,
  value: code,
}));

const requiredName = (value: Translatable | undefined) =>
  (typeof value === 'string'
    ? value.trim() !== ''
    : !!value && Object.values(value).some((text) => text.trim() !== '')) ||
  t('validation.required');
const required = (value: unknown) =>
  (value !== null && value !== undefined && value !== '') ||
  t('validation.required');
const nonNegative = (value: number | string) =>
  value === '' || Number(value) >= 0 || t('validation.nonNegative');
const percent = (value: number | string) =>
  value === '' ||
  (Number(value) >= 0 && Number(value) <= 100) ||
  t('validation.percent');

/** Rounded to the cent, as the API only accepts two decimals. */
function cents(value: number | string): number {
  return Math.round(Number(value || 0) * 100) / 100;
}

function onSubmit() {
  if (name.value === undefined) {
    return;
  }

  onDialogOK({
    name: name.value,
    currency: currency.value,
    pricePerRegistration: cents(pricePerRegistration.value),
    baseFee: cents(baseFee.value),
    taxRate: cents(taxRate.value),
  } satisfies PriceModelCreateData);
}
</script>

<style scoped lang="scss">
.price-model-card {
  width: 560px;
  max-width: 90vw;
}

// Two aligned columns: every field in a row has the same height because
// hints live in one shared caption rather than under a single input.
.price-model-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;

  .span-2 {
    grid-column: span 2;
  }

  @media (max-width: 599px) {
    grid-template-columns: 1fr;

    .span-2 {
      grid-column: auto;
    }
  }
}
</style>

<i18n lang="yaml" locale="en">
title:
  create: 'New price model'
  edit: 'Edit price model'
field:
  name: 'Name'
  currency: 'Currency'
  pricePerRegistration: 'Price per registration'
  baseFee: 'Base fee per event'
  taxRate: 'Tax rate'
hint: 'The base fee is charged once per event, on top of the price per registration.'
validation:
  required: 'Required'
  nonNegative: 'Must not be negative'
  percent: 'Must be between 0 and 100'
action:
  cancel: 'Cancel'
  save: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title:
  create: 'Neues Preismodell'
  edit: 'Preismodell bearbeiten'
field:
  name: 'Name'
  currency: 'Währung'
  pricePerRegistration: 'Preis pro Anmeldung'
  baseFee: 'Grundgebühr pro Veranstaltung'
  taxRate: 'Steuersatz'
hint: 'Die Grundgebühr wird einmal pro Veranstaltung zusätzlich zum Preis pro Anmeldung berechnet.'
validation:
  required: 'Erforderlich'
  nonNegative: 'Darf nicht negativ sein'
  percent: 'Muss zwischen 0 und 100 liegen'
action:
  cancel: 'Abbrechen'
  save: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  create: 'Nouveau modèle tarifaire'
  edit: 'Modifier le modèle tarifaire'
field:
  name: 'Nom'
  currency: 'Devise'
  pricePerRegistration: 'Prix par inscription'
  baseFee: 'Frais de base par événement'
  taxRate: 'Taux de taxe'
hint: 'Les frais de base sont facturés une fois par événement, en plus du prix par inscription.'
validation:
  required: 'Obligatoire'
  nonNegative: 'Ne doit pas être négatif'
  percent: 'Doit être compris entre 0 et 100'
action:
  cancel: 'Annuler'
  save: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  create: 'Nowy model cenowy'
  edit: 'Edytuj model cenowy'
field:
  name: 'Nazwa'
  currency: 'Waluta'
  pricePerRegistration: 'Cena za zgłoszenie'
  baseFee: 'Opłata podstawowa za wydarzenie'
  taxRate: 'Stawka podatku'
hint: 'Opłata podstawowa jest naliczana raz na wydarzenie, dodatkowo do ceny za zgłoszenie.'
validation:
  required: 'Wymagane'
  nonNegative: 'Nie może być ujemna'
  percent: 'Musi mieścić się w przedziale od 0 do 100'
action:
  cancel: 'Anuluj'
  save: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  create: 'Nový cenový model'
  edit: 'Upravit cenový model'
field:
  name: 'Název'
  currency: 'Měna'
  pricePerRegistration: 'Cena za přihlášku'
  baseFee: 'Základní poplatek za akci'
  taxRate: 'Sazba daně'
hint: 'Základní poplatek se účtuje jednou za akci, navíc k ceně za přihlášku.'
validation:
  required: 'Povinné'
  nonNegative: 'Nesmí být záporné'
  percent: 'Musí být mezi 0 a 100'
action:
  cancel: 'Zrušit'
  save: 'Uložit'
</i18n>
