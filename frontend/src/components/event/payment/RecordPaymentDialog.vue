<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card
      class="rounded-xl"
      style="width: min(440px, 95vw)"
    >
      <q-form @submit="submit">
        <q-card-section>
          <div class="text-h6">{{ t('title') }}</div>
          <div class="text-body2 text-on-surface-variant q-mt-xs">
            {{ t('hint') }}
          </div>
        </q-card-section>

        <q-card-section class="column q-gutter-md">
          <q-input
            v-model.number="amount"
            :label="t('field.amount')"
            :suffix="currencySymbol(currency, locale)"
            :rules="[
              (val: number) => (!!val && val > 0) || t('validation.amount'),
            ]"
            type="number"
            step="0.01"
            min="0"
            input-class="text-right"
            outlined
            rounded
            autofocus
            data-test="record-payment-amount"
          />
          <q-select
            v-model="method"
            :label="t('field.method')"
            :options="methodOptions"
            emit-value
            map-options
            outlined
            rounded
          />
          <q-input
            v-model="paidAt"
            :label="t('field.paidAt')"
            type="date"
            outlined
            rounded
          />
          <q-input
            v-model="note"
            :label="t('field.note')"
            type="textarea"
            autogrow
            outlined
            rounded
          />
        </q-card-section>

        <q-card-actions align="right">
          <m-btn
            text
            :label="t('action.cancel')"
            @click="onDialogCancel"
          />
          <m-btn
            type="submit"
            primary
            :label="t('action.save')"
            data-test="record-payment-save"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { PaymentCreateData } from '@camp-registration/common/entities';
import {
  currencySymbol,
  fromMinorUnits,
} from '@camp-registration/common/utils';

const { currency, outstanding } = defineProps<{
  currency: string;
  /** Minor units, suggested as the amount. */
  outstanding: number;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t, locale } = useI18n();

const amount = ref<number | null>(
  outstanding > 0 ? fromMinorUnits(outstanding, currency) : null,
);
const method = ref<string>('bank_transfer');
const paidAt = ref<string>(new Date().toISOString().slice(0, 10));
const note = ref<string>('');

const methodOptions = computed(() =>
  ['bank_transfer', 'cash', 'other'].map((value) => ({
    value,
    label: t(`method.${value}`),
  })),
);

function submit(): void {
  if (!amount.value) {
    return;
  }

  onDialogOK({
    amount: amount.value,
    method: method.value,
    paidAt: new Date(`${paidAt.value}T12:00:00`).toISOString(),
    note: note.value.trim() || null,
  } satisfies PaymentCreateData);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Record payment'
hint: 'Record money received outside the online checkout, e.g. by bank transfer or in cash.'
field:
  amount: 'Amount'
  method: 'Method'
  paidAt: 'Received on'
  note: 'Note'
validation:
  amount: 'Enter an amount greater than zero'
method:
  bank_transfer: 'Bank transfer'
  cash: 'Cash'
  other: 'Other'
action:
  cancel: 'Cancel'
  save: 'Record'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zahlung erfassen'
hint: 'Erfasse Geld, das außerhalb der Online-Zahlung eingegangen ist, z. B. per Überweisung oder bar.'
field:
  amount: 'Betrag'
  method: 'Zahlungsart'
  paidAt: 'Eingegangen am'
  note: 'Notiz'
validation:
  amount: 'Gib einen Betrag größer als null ein'
method:
  bank_transfer: 'Überweisung'
  cash: 'Bar'
  other: 'Sonstige'
action:
  cancel: 'Abbrechen'
  save: 'Erfassen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Enregistrer un paiement'
hint: 'Enregistrez un montant reçu en dehors du paiement en ligne, par ex. par virement ou en espèces.'
field:
  amount: 'Montant'
  method: 'Moyen'
  paidAt: 'Reçu le'
  note: 'Note'
validation:
  amount: 'Saisissez un montant supérieur à zéro'
method:
  bank_transfer: 'Virement bancaire'
  cash: 'Espèces'
  other: 'Autre'
action:
  cancel: 'Annuler'
  save: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zarejestruj płatność'
hint: 'Zarejestruj pieniądze otrzymane poza płatnością online, np. przelewem lub gotówką.'
field:
  amount: 'Kwota'
  method: 'Metoda'
  paidAt: 'Otrzymano dnia'
  note: 'Notatka'
validation:
  amount: 'Wpisz kwotę większą od zera'
method:
  bank_transfer: 'Przelew bankowy'
  cash: 'Gotówka'
  other: 'Inna'
action:
  cancel: 'Anuluj'
  save: 'Zarejestruj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Zaznamenat platbu'
hint: 'Zaznamenejte peníze přijaté mimo online platbu, např. bankovním převodem nebo v hotovosti.'
field:
  amount: 'Částka'
  method: 'Způsob'
  paidAt: 'Přijato dne'
  note: 'Poznámka'
validation:
  amount: 'Zadejte částku větší než nula'
method:
  bank_transfer: 'Bankovní převod'
  cash: 'Hotovost'
  other: 'Jiné'
action:
  cancel: 'Zrušit'
  save: 'Zaznamenat'
</i18n>
