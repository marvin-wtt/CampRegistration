<template>
  <!-- A full-height sheet on phones, like the expense capture. -->
  <responsive-dialog
    ref="dialogRef"
    :snap-points="['full']"
    persistent
    @hide="onDialogHide"
  >
    <dialog-card
      :title="income ? t('editTitle') : t('newTitle')"
      :width="560"
      no-form
      @cancel="onDialogCancel"
    >
      <template #header-actions>
        <div
          v-if="income"
          class="text-body2 text-on-surface-variant text-mono q-mt-sm"
        >
          {{ income.label }}
        </div>
        <m-btn
          v-if="quasar.screen.lt.sm"
          color="on-surface-variant"
          icon="close"
          flat
          round
          :aria-label="t('finance.action.close')"
          @click="onDialogCancel"
        />
      </template>

      <q-form
        ref="formRef"
        class="column no-wrap q-gutter-y-md"
        @submit.prevent="save"
      >
        <amount-input
          v-model="form.amount"
          :currency
          :label="t('finance.field.amount')"
          :autofocus="!income"
          hide-bottom-space
          large
          data-test="income-amount"
        >
          <template #append>
            <m-btn
              icon="currency_exchange"
              :color="showOriginal ? 'primary' : undefined"
              flat
              round
              dense
              class="q-ml-xs"
              :aria-label="t('finance.field.originalToggle')"
              :aria-pressed="showOriginal"
              @click="showOriginal = !showOriginal"
            >
              <q-tooltip>{{ t('finance.field.originalToggle') }}</q-tooltip>
            </m-btn>
          </template>
        </amount-input>

        <q-slide-transition>
          <div
            v-show="showOriginal"
            class="row no-wrap original-row"
          >
            <currency-select
              v-model="form.originalCurrency"
              :exclude="currency"
              :label="t('finance.field.originalCurrency')"
              class="original-currency"
              :rules="[
                (val: string | null) =>
                  !form.originalAmount ||
                  /^[A-Z]{3}$/.test(val ?? '') ||
                  t('finance.validation.currency'),
              ]"
            />
            <amount-input
              v-model="form.originalAmount"
              :currency="form.originalCurrency ?? currency"
              :label="t('finance.field.originalAmount')"
              :required="!!form.originalCurrency"
              class="col"
              dense
            />
          </div>
        </q-slide-transition>

        <!-- Money back from a purchase reduces the costs: it is a refund
             among the expenses, never income. -->
        <div
          v-if="!income && can('event.expenses.create')"
          class="refund-hint rounded-lg"
          :class="quasar.screen.xs ? 'column' : 'row items-center no-wrap'"
          data-test="income-refund-hint"
        >
          <div class="row no-wrap items-start col refund-hint__text">
            <q-icon
              name="info"
              size="20px"
              class="refund-hint__icon"
            />
            <span class="text-body2">{{ t('refundHint') }}</span>
          </div>
          <m-btn
            :label="t('asRefund')"
            color="primary"
            text
            rounded
            no-caps
            class="self-end"
            data-test="income-as-refund"
            @click="switchToRefund"
          />
        </div>

        <q-input
          v-model="form.description"
          :label="t('finance.field.description')"
          :placeholder="t('descriptionPlaceholder')"
          :rules="[
            (val?: string) =>
              !!val?.trim() || t('finance.validation.description'),
          ]"
          maxlength="255"
          enterkeyhint="done"
          hide-bottom-space
          outlined
          rounded
          data-test="income-description"
        />

        <!-- Empty while promised: it counts once it has arrived. -->
        <event-date-input
          v-model="form.receivedOn"
          :label="t('receivedOn')"
          :hint="form.receivedOn ? undefined : t('promisedHint')"
          open-on-today
          clearable
        />

        <category-picker
          v-if="categories.length > 0"
          v-model="form.categoryId"
          :categories
          :keep="income?.categoryId ?? null"
        />

        <q-input
          v-model="form.payerName"
          :label="t('payer')"
          :hint="t('payerHint')"
          maxlength="255"
          list="income-payers"
          autocomplete="off"
          enterkeyhint="done"
          hide-bottom-space
          outlined
          rounded
          clearable
          data-test="income-payer"
        />
        <datalist id="income-payers">
          <option
            v-for="payer in payers"
            :key="payer"
            :value="payer"
          />
        </datalist>

        <receipt-file-strip
          :files
          @add="addFiles"
          @remove="removeFile"
        />
      </q-form>

      <template #actions>
        <m-btn
          v-if="!quasar.screen.lt.sm"
          :label="t('finance.action.cancel')"
          color="primary"
          text
          rounded
          @click="onDialogCancel"
        />
        <m-btn
          :label="t('finance.action.save')"
          :loading="saving"
          :disable="saving || uploading"
          color="primary"
          rounded
          data-test="income-save"
          @click="save"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { type QForm, useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Income } from '@camp-registration/common/entities';
import { useReceiptUploads } from '@/composables/receiptUploads';
import ReceiptFileStrip from '@/components/event/finances/ReceiptFileStrip.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import AmountInput from '@/components/event/finances/AmountInput.vue';
import CurrencySelect from '@/components/event/finances/CurrencySelect.vue';
import CategoryPicker from '@/components/event/finances/CategoryPicker.vue';
import EventDateInput from '@/components/event/EventDateInput.vue';
import { useFinanceStore } from '@/stores/finance-store';
import { useIncomeStore } from '@/stores/income-store';
import { useFinanceFormat } from '@/composables/financeFormat';
import { usePermissions } from '@/composables/permissions';
import { formatLocalDate } from '@/utils/date';
import { useFinanceDialogs } from '@/composables/financeDialogs';

const { income = undefined } = defineProps<{
  /** Edits this one; records a new income without. */
  income?: Income | undefined;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const quasar = useQuasar();
const { t } = useI18n();
const { can } = usePermissions();
const { currency } = useFinanceFormat();
const incomeStore = useIncomeStore();
const { incomeCategories } = storeToRefs(useFinanceStore());

const formRef = useTemplateRef<QForm>('formRef');
const categories = computed(() => incomeCategories.value ?? []);
// The funders named before, so the same one is spelled the same way.
const payers = computed(() =>
  [
    ...new Set(
      (incomeStore.incomes ?? []).flatMap((i) =>
        i.payerName ? [i.payerName] : [],
      ),
    ),
  ].sort((a, b) => a.localeCompare(b)),
);

const form = reactive({
  amount: income?.amount ?? null,
  originalAmount: income?.originalAmount ?? null,
  originalCurrency: income?.originalCurrency ?? null,
  description: income?.description ?? '',
  // Usually recorded as it arrives; cleared for a promise.
  receivedOn: income ? income.receivedOn : formatLocalDate(new Date()),
  payerName: income?.payerName ?? null,
  categoryId: income?.categoryId ?? null,
});
const showOriginal = ref(!!income?.originalCurrency);
const saving = ref(false);

const {
  files,
  uploading,
  uploadedIds,
  add: addFiles,
  remove: removeFile,
} = useReceiptUploads(income?.files ?? []);

async function save() {
  if (!(await formRef.value?.validate()) || form.amount === null) {
    return;
  }

  const original =
    showOriginal.value && form.originalAmount && form.originalCurrency
      ? {
          originalAmount: form.originalAmount,
          originalCurrency: form.originalCurrency,
        }
      : { originalAmount: null, originalCurrency: null };
  const data = {
    amount: form.amount,
    ...original,
    description: form.description.trim(),
    receivedOn: form.receivedOn ?? null,
    payerName: form.payerName?.trim() || null,
    categoryId: form.categoryId,
    fileIds: uploadedIds.value,
  };

  saving.value = true;
  try {
    onDialogOK(
      income
        ? await incomeStore.updateIncome(income.id, data)
        : await incomeStore.createIncome(data),
    );
  } catch {
    // Reported by the store; the form stays for another try.
  } finally {
    saving.value = false;
  }
}

const dialogs = useFinanceDialogs();

// Hands what was typed to the expense capture, as a refund.
function switchToRefund() {
  const prefill = {
    type: 'REFUND' as const,
    amount: form.amount,
    description: form.description,
    date: form.receivedOn,
    files: files.value.flatMap((f) =>
      f.id ? [{ key: f.key, id: f.id, name: f.name }] : [],
    ),
  };
  onDialogCancel();
  dialogs.captureFrom(prefill);
}
</script>

<style scoped>
.text-mono {
  font-variant-numeric: tabular-nums;
}

.refund-hint {
  gap: 4px 8px;
  padding: 8px 4px 4px 12px;
  background: var(--md3-surface-container-high);
}

.refund-hint__text {
  gap: 8px;
}

.refund-hint__icon {
  color: var(--md3-on-surface-variant);
}

.original-row {
  gap: 8px;
}

.original-currency {
  /* The code, the clear icon and the arrow on one line. */
  width: 136px;
  flex: 0 0 auto;
}
</style>

<i18n lang="yaml" locale="en">
refundHint: 'Money back from a purchase? That is a refund under expenses.'
asRefund: 'Record as refund'
newTitle: 'Record income'
editTitle: 'Edit income'
descriptionPlaceholder: 'e.g. State youth grant'
receivedOn: 'Received on'
promisedHint: 'Not received yet: counts as promised'
payer: 'From'
payerHint: 'Who gave it: a funder, a sponsor'
</i18n>

<i18n lang="yaml" locale="de">
refundHint: 'Geld zurück aus einem Einkauf? Das ist eine Erstattung bei den Ausgaben.'
asRefund: 'Als Erstattung erfassen'
newTitle: 'Einnahme erfassen'
editTitle: 'Einnahme bearbeiten'
descriptionPlaceholder: 'z. B. Landesjugendplan-Zuschuss'
receivedOn: 'Eingegangen am'
promisedHint: 'Noch nicht eingegangen: zählt als zugesagt'
payer: 'Von'
payerHint: 'Wer es gegeben hat: ein Förderer, ein Sponsor'
</i18n>

<i18n lang="yaml" locale="fr">
refundHint: 'Argent rendu sur un achat ? C’est un remboursement dans les dépenses.'
asRefund: 'Enregistrer comme remboursement'
newTitle: 'Enregistrer une recette'
editTitle: 'Modifier la recette'
descriptionPlaceholder: 'p. ex. subvention régionale jeunesse'
receivedOn: 'Reçu le'
promisedHint: 'Pas encore reçu : compte comme promis'
payer: 'De'
payerHint: 'Qui l’a donné : un financeur, un sponsor'
</i18n>

<i18n lang="yaml" locale="pl">
refundHint: 'Zwrot pieniędzy za zakup? To zwrot w wydatkach.'
asRefund: 'Zapisz jako zwrot'
newTitle: 'Zapisz przychód'
editTitle: 'Edytuj przychód'
descriptionPlaceholder: 'np. dotacja na pracę z młodzieżą'
receivedOn: 'Data wpływu'
promisedHint: 'Jeszcze nie wpłynęło: liczone jako obiecane'
payer: 'Od'
payerHint: 'Kto przekazał: grantodawca, sponsor'
</i18n>

<i18n lang="yaml" locale="cs">
refundHint: 'Peníze zpět z nákupu? To je vratka mezi výdaji.'
asRefund: 'Zaznamenat jako vratku'
newTitle: 'Zaznamenat příjem'
editTitle: 'Upravit příjem'
descriptionPlaceholder: 'např. dotace na práci s mládeží'
receivedOn: 'Přijato dne'
promisedHint: 'Zatím nepřijato: počítá se jako přislíbené'
payer: 'Od'
payerHint: 'Kdo ho poskytl: donor, sponzor'
</i18n>
