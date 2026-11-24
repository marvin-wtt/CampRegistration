<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      :subtitle="quote"
      icon="price_change"
      @submit="submit"
      @cancel="onDialogCancel"
    >
      <div class="column no-wrap q-gutter-y-md">
        <amount-input
          v-model="amount"
          :currency="fee.balance.currency"
          :label="t('amount')"
          allow-zero
          autofocus
          large
          data-test="amount-due-amount"
        />
        <q-input
          v-model="note"
          :label="t('note')"
          :hint="t('noteHint')"
          maxlength="255"
          autogrow
          outlined
          rounded
          data-test="amount-due-note"
        />
      </div>

      <template #actions>
        <m-btn
          v-if="fee.amountDue.override !== null"
          :label="t('reset')"
          :loading="saving === 'reset'"
          text
          rounded
          color="primary"
          data-test="amount-due-reset"
          @click="save(null)"
        />
        <q-space />
        <m-btn
          :label="t('finance.action.cancel')"
          text
          rounded
          color="primary"
          @click="onDialogCancel"
        />
        <m-btn
          :label="t('finance.action.save')"
          :loading="saving === 'set'"
          rounded
          color="primary"
          type="submit"
          data-test="amount-due-submit"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { RegistrationFee } from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import AmountInput from '@/components/event/finances/AmountInput.vue';
import { useFeeStore } from '@/stores/fee-store';
import { useFinanceFormat } from '@/composables/financeFormat';

const { fee } = defineProps<{ fee: RegistrationFee }>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { t } = useI18n();
const { money } = useFinanceFormat();
const feeStore = useFeeStore();

const { quotedAmount, override } = fee.amountDue;
const amount = ref<number | null>(override ?? quotedAmount);
const note = ref(fee.amountDue.note ?? '');
const saving = ref<'set' | 'reset' | null>(null);

const quote = computed(() =>
  quotedAmount === null
    ? t('noQuote')
    : t('quote', { amount: money(quotedAmount, fee.balance.currency) }),
);

function submit() {
  if (amount.value !== null) {
    void save(amount.value);
  }
}

async function save(value: number | null) {
  saving.value = value === null ? 'reset' : 'set';
  try {
    onDialogOK(
      await feeStore.updateAmountDue(fee.id, {
        amount: value,
        note: value === null ? null : note.value.trim() || null,
      }),
    );
  } catch {
    // Reported by the store.
  } finally {
    saving.value = null;
  }
}
</script>

<i18n lang="yaml" locale="en">
title: 'Set amount due'
quote: 'The form quoted {amount}'
noQuote: 'Registered before quotes were stored'
amount: 'Amount due'
note: 'Why (optional)'
noteHint: 'E.g. a sibling discount'
reset: 'Back to the quote'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Betrag festlegen'
quote: 'Das Formular nannte {amount}'
noQuote: 'Angemeldet, bevor Beträge gespeichert wurden'
amount: 'Fälliger Betrag'
note: 'Warum (optional)'
noteHint: 'Z. B. Geschwisterrabatt'
reset: 'Zurück zum Formularbetrag'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Fixer le montant dû'
quote: 'Le formulaire indiquait {amount}'
noQuote: 'Inscrit avant que les montants soient enregistrés'
amount: 'Montant dû'
note: 'Pourquoi (facultatif)'
noteHint: 'Par ex. une réduction fratrie'
reset: 'Revenir au montant du formulaire'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Ustal kwotę należną'
quote: 'Formularz podał {amount}'
noQuote: 'Zgłoszenie sprzed zapisywania kwot'
amount: 'Kwota należna'
note: 'Dlaczego (opcjonalnie)'
noteHint: 'Np. zniżka dla rodzeństwa'
reset: 'Wróć do kwoty z formularza'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Stanovit dlužnou částku'
quote: 'Formulář uvedl {amount}'
noQuote: 'Registrace z doby před ukládáním částek'
amount: 'Dlužná částka'
note: 'Proč (nepovinné)'
noteHint: 'Např. sleva pro sourozence'
reset: 'Zpět na částku z formuláře'
</i18n>
