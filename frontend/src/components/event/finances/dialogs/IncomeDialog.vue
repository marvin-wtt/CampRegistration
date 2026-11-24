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
            <q-select
              v-model="form.originalCurrency"
              :options="FOREIGN_CURRENCIES"
              :label="t('finance.field.originalCurrency')"
              class="original-currency"
              use-input
              fill-input
              hide-selected
              new-value-mode="add-unique"
              :input-debounce="0"
              clearable
              dense
              outlined
              rounded
              hide-bottom-space
              :rules="[
                (val: string | null) =>
                  !form.originalAmount ||
                  /^[A-Z]{3}$/.test(val ?? '') ||
                  t('finance.validation.currency'),
              ]"
              @new-value="addCurrency"
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
          v-if="income && can('event.income.delete')"
          :label="t('finance.action.delete')"
          icon="delete"
          color="error"
          text
          rounded
          :disable="saving"
          data-test="income-delete"
          @click="remove"
        />
        <q-space />
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
import CategoryPicker from '@/components/event/finances/CategoryPicker.vue';
import EventDateInput from '@/components/event/EventDateInput.vue';
import { useFinanceStore } from '@/stores/finance-store';
import { useIncomeStore } from '@/stores/income-store';
import { useFinanceFormat } from '@/composables/financeFormat';
import { usePermissions } from '@/composables/permissions';
import { formatLocalDate } from '@/utils/date';

const FOREIGN_CURRENCIES = ['PLN', 'CZK', 'GBP', 'CHF', 'USD', 'DKK', 'HUF'];

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

function addCurrency(value: string, done: (item?: string) => void) {
  const code = value.trim().toUpperCase();
  done(/^[A-Z]{3}$/.test(code) ? code : undefined);
}

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

function remove() {
  if (!income) {
    return;
  }
  quasar
    .dialog({
      title: t('deleteTitle', { label: income.label }),
      message: t('deleteMessage'),
      cancel: {
        label: t('finance.action.cancel'),
        color: 'primary',
        flat: true,
        rounded: true,
      },
      ok: {
        label: t('finance.action.delete'),
        color: 'error',
        rounded: true,
        unelevated: true,
      },
    })
    .onOk(() => void confirmRemove(income.id));
}

async function confirmRemove(incomeId: string) {
  saving.value = true;
  try {
    await incomeStore.deleteIncome(incomeId);
    onDialogOK();
  } catch {
    // Reported by the store.
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.text-mono {
  font-variant-numeric: tabular-nums;
}

.original-row {
  gap: 8px;
}

.original-currency {
  /* Three letters, the clear icon and the arrow on one line. */
  width: 136px;
  flex: 0 0 auto;
}
</style>

<i18n lang="yaml" locale="en">
newTitle: 'Record income'
editTitle: 'Edit income'
descriptionPlaceholder: 'e.g. State youth grant'
receivedOn: 'Received on'
promisedHint: 'Not received yet: counts as promised'
payer: 'From'
payerHint: 'Who gave it: a funder, a sponsor'
deleteTitle: 'Delete {label}?'
deleteMessage: 'Its number is not given out again.'
</i18n>

<i18n lang="yaml" locale="de">
newTitle: 'Einnahme erfassen'
editTitle: 'Einnahme bearbeiten'
descriptionPlaceholder: 'z. B. Landesjugendplan-Zuschuss'
receivedOn: 'Eingegangen am'
promisedHint: 'Noch nicht eingegangen: zählt als zugesagt'
payer: 'Von'
payerHint: 'Wer es gegeben hat: ein Förderer, ein Sponsor'
deleteTitle: '{label} löschen?'
deleteMessage: 'Die Nummer wird nicht erneut vergeben.'
</i18n>

<i18n lang="yaml" locale="fr">
newTitle: 'Enregistrer une recette'
editTitle: 'Modifier la recette'
descriptionPlaceholder: 'p. ex. subvention régionale jeunesse'
receivedOn: 'Reçu le'
promisedHint: 'Pas encore reçu : compte comme promis'
payer: 'De'
payerHint: 'Qui l’a donné : un financeur, un sponsor'
deleteTitle: 'Supprimer {label} ?'
deleteMessage: 'Son numéro ne sera pas réattribué.'
</i18n>

<i18n lang="yaml" locale="pl">
newTitle: 'Zapisz przychód'
editTitle: 'Edytuj przychód'
descriptionPlaceholder: 'np. dotacja na pracę z młodzieżą'
receivedOn: 'Data wpływu'
promisedHint: 'Jeszcze nie wpłynęło: liczone jako obiecane'
payer: 'Od'
payerHint: 'Kto przekazał: grantodawca, sponsor'
deleteTitle: 'Usunąć {label}?'
deleteMessage: 'Jego numer nie zostanie użyty ponownie.'
</i18n>

<i18n lang="yaml" locale="cs">
newTitle: 'Zaznamenat příjem'
editTitle: 'Upravit příjem'
descriptionPlaceholder: 'např. dotace na práci s mládeží'
receivedOn: 'Přijato dne'
promisedHint: 'Zatím nepřijato: počítá se jako přislíbené'
payer: 'Od'
payerHint: 'Kdo ho poskytl: donor, sponzor'
deleteTitle: 'Smazat {label}?'
deleteMessage: 'Jeho číslo se znovu nepřidělí.'
</i18n>
