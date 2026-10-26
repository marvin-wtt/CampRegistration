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
              (val: number | string) =>
                (val !== '' && Number(val) >= 0) || t('validation.amount'),
            ]"
            type="number"
            step="0.01"
            min="0"
            input-class="text-right"
            outlined
            rounded
            autofocus
            data-test="adjust-amount-due-amount"
          />
          <q-input
            v-model="note"
            :label="t('field.note')"
            :hint="t('field.noteHint')"
            type="textarea"
            autogrow
            outlined
            rounded
            maxlength="500"
          />
        </q-card-section>

        <q-card-actions align="right">
          <m-btn
            v-if="adjusted && quotedAmount !== null"
            text
            primary
            :label="
              t('action.reset', {
                amount: formatMoney(quotedAmount, currency, locale),
              })
            "
            class="q-mr-auto"
            data-test="adjust-amount-due-reset"
            @click="reset"
          />
          <m-btn
            text
            :label="t('action.cancel')"
            @click="onDialogCancel"
          />
          <m-btn
            type="submit"
            primary
            :label="t('action.save')"
            data-test="adjust-amount-due-save"
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
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { AmountDueUpdateData } from '@camp-registration/common/entities';
import {
  currencySymbol,
  formatMoney,
  fromMinorUnits,
} from '@camp-registration/common/utils';

const {
  currency,
  amountDue,
  quotedAmount = null,
  suggestedAmount = null,
  note: currentNote = null,
  adjusted = false,
} = defineProps<{
  currency: string;
  /** Minor units, the current amount. */
  amountDue: number | null;
  /** Minor units: what the form showed at registration. */
  quotedAmount?: number | null;
  /** Minor units: prefilled instead of `amountDue`, e.g. the answers' total. */
  suggestedAmount?: number | null;
  note?: string | null;
  adjusted?: boolean;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t, locale } = useI18n();

const amount = ref<number | string>(
  (suggestedAmount ?? amountDue) !== null
    ? fromMinorUnits((suggestedAmount ?? amountDue)!, currency)
    : '',
);
const note = ref<string>(currentNote ?? '');

function submit(): void {
  if (amount.value === '') {
    return;
  }

  onDialogOK({
    amount: Number(amount.value),
    note: note.value.trim() || null,
  } satisfies AmountDueUpdateData);
}

function reset(): void {
  onDialogOK({ amount: null } satisfies AmountDueUpdateData);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Change amount due'
hint: 'Set what this registration owes, e.g. to waive the fee or grant a discount. People owe what the registration form showed them; change it only on purpose.'
field:
  amount: 'Amount due'
  note: 'Reason'
  noteHint: 'Only visible to managers'
validation:
  amount: 'Enter an amount of zero or more'
action:
  reset: 'Back to {amount} as shown at registration'
  cancel: 'Cancel'
  save: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Fälligen Betrag ändern'
hint: 'Lege fest, was diese Anmeldung schuldet, z. B. um den Beitrag zu erlassen oder einen Rabatt zu gewähren. Geschuldet ist, was das Anmeldeformular angezeigt hat; ändere es nur bewusst.'
field:
  amount: 'Fälliger Betrag'
  note: 'Grund'
  noteHint: 'Nur für die Leitung sichtbar'
validation:
  amount: 'Gib einen Betrag von null oder mehr ein'
action:
  reset: 'Zurück zu {amount} wie bei der Anmeldung angezeigt'
  cancel: 'Abbrechen'
  save: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier le montant dû'
hint: "Définissez ce que doit cette inscription, par exemple pour annuler les frais ou accorder une réduction. Le montant dû est celui affiché par le formulaire d'inscription ; ne le modifiez que délibérément."
field:
  amount: 'Montant dû'
  note: 'Motif'
  noteHint: "Visible uniquement par l'équipe de gestion"
validation:
  amount: 'Saisissez un montant supérieur ou égal à zéro'
action:
  reset: "Revenir à {amount} comme affiché à l'inscription"
  cancel: 'Annuler'
  save: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zmień kwotę do zapłaty'
hint: 'Określ, ile wynosi należność za to zgłoszenie, np. aby zwolnić z opłaty lub przyznać zniżkę. Należna jest kwota pokazana w formularzu rejestracji; zmieniaj ją tylko celowo.'
field:
  amount: 'Kwota do zapłaty'
  note: 'Powód'
  noteHint: 'Widoczne tylko dla organizatorów'
validation:
  amount: 'Wpisz kwotę równą zero lub większą'
action:
  reset: 'Wróć do {amount} jak przy rejestracji'
  cancel: 'Anuluj'
  save: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Změnit dlužnou částku'
hint: 'Nastav, kolik tato registrace dluží, např. pro odpuštění poplatku nebo slevu. Dluží se částka zobrazená v registračním formuláři; měň ji jen záměrně.'
field:
  amount: 'Dlužná částka'
  note: 'Důvod'
  noteHint: 'Vidí jen vedení'
validation:
  amount: 'Zadej částku nula nebo vyšší'
action:
  reset: 'Zpět na {amount} jako při registraci'
  cancel: 'Zrušit'
  save: 'Uložit'
</i18n>
