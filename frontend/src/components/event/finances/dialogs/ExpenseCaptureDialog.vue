<template>
  <!-- A full-height sheet on phones: the form is long and the keyboard
       takes half the screen. Never dismissed by a stray tap. -->
  <responsive-dialog
    ref="dialogRef"
    :snap-points="['full']"
    persistent
    @hide="onDialogHide"
  >
    <dialog-card
      :title
      :width="560"
      no-form
      @cancel="onDialogCancel"
    >
      <template #header-actions>
        <div
          v-if="!saved && expense"
          class="text-body2 text-on-surface-variant receipt-mono q-mt-sm"
        >
          #{{ expense.receiptNumber }}
        </div>
        <!-- The persistent sheet can't be swiped away; cancel lives here. -->
        <q-btn
          v-if="quasar.screen.lt.sm"
          icon="close"
          flat
          round
          :aria-label="t('finance.action.close')"
          data-test="expense-capture-close"
          @click="onDialogCancel"
        />
      </template>

      <!-- Saved: the number to write on the paper receipt -->
      <div
        v-if="saved"
        class="column no-wrap q-gutter-y-md q-pt-sm"
        data-test="expense-saved"
      >
        <div class="receipt-tag rounded-xl column items-center text-center">
          <div class="row items-center no-wrap q-gutter-x-xs text-body2">
            <q-icon
              name="check_circle"
              size="20px"
            />
            <span>{{ t('finance.capture.savedAs') }}</span>
          </div>
          <div class="receipt-number receipt-mono">
            #{{ saved.receiptNumber }}
          </div>
          <div class="row items-center no-wrap q-gutter-x-xs text-body2">
            <q-icon
              name="edit_note"
              size="20px"
            />
            <span>{{ t('finance.capture.writeNumber') }}</span>
          </div>
        </div>

        <q-list
          bordered
          class="rounded-lg"
        >
          <q-item>
            <q-item-section>
              <q-item-label class="ellipsis">
                {{ saved.description }}
              </q-item-label>
              <q-item-label caption>
                {{ savedMeta }}
              </q-item-label>
            </q-item-section>
            <q-item-section
              side
              class="text-subtitle1 text-weight-medium text-on-surface amount"
            >
              {{ signedMoney(saved) }}
            </q-item-section>
          </q-item>
        </q-list>

        <q-banner
          v-if="saved.files.length === 0"
          dense
          rounded
          class="bg-warning-container text-on-warning-container"
        >
          <template #avatar>
            <q-icon name="photo_camera" />
          </template>
          {{ t('finance.capture.noPhoto') }}
        </q-banner>
      </div>

      <!-- Form -->
      <q-form
        v-else
        ref="formRef"
        class="column no-wrap"
        @submit.prevent="save"
      >
        <div class="column no-wrap q-gutter-y-md">
          <q-banner
            v-if="restored"
            dense
            rounded
            class="bg-secondary-container text-on-secondary-container"
          >
            {{ t('finance.capture.restored') }}
            <template #action>
              <q-btn
                flat
                rounded
                :label="t('finance.action.discard')"
                @click="discardDraft"
              />
            </template>
          </q-banner>

          <q-btn-toggle
            v-model="form.type"
            :options="typeOptions"
            spread
            rounded
            unelevated
            no-caps
            toggle-color="secondary-container"
            toggle-text-color="on-secondary-container"
            class="type-toggle"
            data-test="expense-type"
          />

          <amount-input
            v-model="form.amount"
            :currency
            :label="t('finance.field.amount')"
            :autofocus="!expense"
            hide-bottom-space
            large
            data-test="expense-amount"
          >
            <template #append>
              <!-- Rare: a receipt in another currency, kept out of the way. -->
              <q-btn
                icon="currency_exchange"
                :color="showOriginal ? 'primary' : undefined"
                flat
                round
                dense
                class="q-ml-xs"
                :aria-label="t('finance.field.originalToggle')"
                :aria-pressed="showOriginal"
                data-test="expense-original-toggle"
                @click="showOriginal = !showOriginal"
              >
                <q-tooltip>{{ t('finance.field.originalToggle') }}</q-tooltip>
              </q-btn>
            </template>
          </amount-input>

          <q-slide-transition>
            <div
              v-show="showOriginal"
              class="row no-wrap q-gutter-x-sm original-row"
            >
              <q-select
                v-model="form.originalCurrency"
                :options="FOREIGN_CURRENCIES"
                :label="t('finance.field.originalCurrency')"
                class="original-currency"
                use-input
                new-value-mode="add-unique"
                :input-debounce="0"
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

          <!-- Receipt photos -->
          <div class="column q-gutter-y-sm">
            <div class="row q-gutter-sm">
              <div
                v-for="file in files"
                :key="file.key"
                class="photo-entry column"
              >
                <div class="photo-tile rounded-md">
                  <button
                    type="button"
                    class="photo-open column items-center justify-center"
                    :disabled="!file.url"
                    :aria-label="
                      t('finance.action.openFile', { name: file.name })
                    "
                    @click="openFile(file)"
                  >
                    <img
                      v-if="file.preview"
                      :src="file.preview"
                      :alt="file.name"
                      class="photo-thumb"
                    />
                    <q-icon
                      v-else
                      name="description"
                      size="32px"
                    />
                    <q-spinner
                      v-if="file.uploading"
                      class="photo-state"
                      color="primary"
                    />
                  </button>
                  <q-btn
                    class="photo-remove"
                    icon="close"
                    size="sm"
                    round
                    unelevated
                    color="surface-container-highest"
                    text-color="on-surface"
                    :aria-label="t('finance.action.removePhoto')"
                    @click="removeFile(file.key)"
                  />
                </div>
                <div
                  class="photo-name ellipsis text-caption text-on-surface-variant"
                >
                  {{ file.name }}
                  <q-tooltip>{{ file.name }}</q-tooltip>
                </div>
              </div>
            </div>
            <m-btn
              :label="
                files.length
                  ? t('finance.action.addPhoto')
                  : t('finance.action.takePhoto')
              "
              icon="photo_camera"
              color="primary"
              tonal
              class="self-start"
              data-test="expense-photo"
              @click="pickFile"
            />
            <!-- A scan is a copy: the paper stays the record. -->
            <div
              class="row items-center no-wrap q-gutter-x-xs text-caption text-on-surface-variant"
            >
              <q-icon
                name="info"
                size="16px"
              />
              <span>{{ t('finance.capture.keepOriginal') }}</span>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              multiple
              hidden
              @change="onFilesPicked"
            />
          </div>

          <q-input
            v-model="form.description"
            :label="t('finance.field.description')"
            :rules="[
              (val?: string) =>
                !!val?.trim() || t('finance.validation.description'),
            ]"
            maxlength="255"
            enterkeyhint="done"
            hide-bottom-space
            outlined
            rounded
            data-test="expense-description"
          />

          <category-chips
            v-if="categories.length > 0"
            v-model="form.categoryId"
            :categories
            :keep="expense?.categoryId ?? null"
          />

          <party-select
            v-model="form.payer"
            :parties
            :label="
              form.type === 'REFUND'
                ? t('finance.field.receivedBy')
                : t('finance.field.paidBy')
            "
            data-test="expense-payer"
          />

          <chore-date-input
            v-model="form.date"
            :label="t('finance.field.receiptDate')"
            :hint="form.date ? undefined : t('finance.field.receiptPending')"
            clearable
          />
        </div>
      </q-form>

      <template #actions>
        <template v-if="saved">
          <m-btn
            :label="t('finance.action.done')"
            text
            @click="onDialogOK(saved)"
          />
          <m-btn
            :label="t('finance.action.nextReceipt')"
            icon="add"
            color="primary"
            data-test="expense-next"
            @click="startNext"
          />
        </template>
        <template v-else>
          <q-btn
            v-if="expense && canDelete"
            icon="delete"
            flat
            round
            color="negative"
            class="q-mr-auto"
            :aria-label="t('finance.action.delete')"
            data-test="expense-delete"
            @click="confirmDelete"
          />
          <m-btn
            v-if="!quasar.screen.lt.sm"
            :label="t('finance.action.cancel')"
            text
            @click="onDialogCancel"
          />
          <m-btn
            :label="t('finance.action.save')"
            :loading="saving"
            :disable="saving || uploading"
            color="primary"
            data-test="expense-save"
            @click="save"
          />
        </template>
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, reactive, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import {
  openURL,
  type QForm,
  useDialogPluginComponent,
  useQuasar,
} from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type {
  Expense,
  ExpenseType,
  ServiceFile,
} from '@camp-registration/common/entities';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import AmountInput from '@/components/event/finances/AmountInput.vue';
import CategoryChips from '@/components/event/finances/CategoryChips.vue';
import PartySelect, {
  type PartyValue,
} from '@/components/event/finances/PartySelect.vue';
import ChoreDateInput from '@/components/event/chorePlanner/ChoreDateInput.vue';
import { useFinanceStore } from '@/stores/finance-store';
import { useFinanceFormat } from '@/composables/financeFormat';
import { useAPIService } from '@/services/APIService';
import { formatLocalDate, parseLocalDate } from '@/utils/date';
import { useRouteKey } from '@/composables/routeKey';

const FOREIGN_CURRENCIES = ['PLN', 'CZK', 'GBP', 'CHF', 'USD', 'DKK', 'HUF'];

interface CaptureFile {
  key: string;
  /** Set once the upload finished; what the expense is saved with. */
  id: string | null;
  name: string;
  /** Where to open it: the stored file, or a blob of a fresh upload. */
  url: string | null;
  preview: string | null;
  uploading: boolean;
}

interface CaptureForm {
  type: ExpenseType;
  amount: number | null;
  originalAmount: number | null;
  originalCurrency: string | null;
  description: string;
  categoryId: string | null;
  payer: PartyValue;
  date: string | null;
}

const { expense = undefined, canDelete = false } = defineProps<{
  /** Edits this expense instead of capturing a new one. */
  expense?: Expense | undefined;
  canDelete?: boolean;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const quasar = useQuasar();
const { t, d } = useI18n();
const api = useAPIService();
const financeStore = useFinanceStore();
const { categories: storeCategories, parties } = storeToRefs(financeStore);
const { currency, signedMoney, categoryName, payerName } = useFinanceFormat();
const eventId = useRouteKey('eventId');

const formRef = useTemplateRef<QForm>('formRef');
const fileInput = useTemplateRef<HTMLInputElement>('fileInput');

const categories = computed(() => storeCategories.value ?? []);

const typeOptions = computed(() => [
  { value: 'EXPENSE', label: t('finance.type.expense'), icon: 'shopping_cart' },
  { value: 'REFUND', label: t('finance.type.refund'), icon: 'undo' },
]);

const title = computed(() => {
  if (saved.value) {
    return t('finance.capture.savedTitle');
  }
  if (expense) {
    return t('finance.capture.editTitle');
  }
  return form.type === 'REFUND'
    ? t('finance.capture.newRefund')
    : t('finance.capture.newExpense');
});

function selfPayer(): PartyValue {
  const self = parties.value?.managers.find(
    (m) => m.userId === parties.value?.selfUserId,
  );
  return self
    ? { userId: self.userId, name: self.name }
    : { userId: null, name: null };
}

function emptyForm(): CaptureForm {
  return {
    type: 'EXPENSE',
    amount: null,
    originalAmount: null,
    originalCurrency: null,
    description: '',
    categoryId: null,
    payer: selfPayer(),
    date: formatLocalDate(new Date()),
  };
}

function formOf(source: Expense): CaptureForm {
  return {
    type: source.type,
    amount: source.amount,
    originalAmount: source.originalAmount,
    originalCurrency: source.originalCurrency,
    description: source.description,
    categoryId: source.categoryId,
    payer: { userId: source.paidByUserId, name: source.paidByName },
    date: source.date,
  };
}

const form = reactive<CaptureForm>(expense ? formOf(expense) : emptyForm());
const files = ref<CaptureFile[]>(
  (expense?.files ?? []).map((file) => existingFile(file)),
);
const showOriginal = ref(!!expense?.originalCurrency);
const saving = ref(false);
const saved = ref<Expense | null>(null);
const restored = ref(false);

const uploading = computed(() => files.value.some((f) => f.uploading));

const savedMeta = computed(() =>
  saved.value
    ? [
        categoryName(saved.value.categoryId),
        payerName(saved.value),
        saved.value.date
          ? d(parseLocalDate(saved.value.date), 'date')
          : t('finance.receiptPending'),
      ]
        .filter(Boolean)
        .join(' · ')
    : '',
);

function existingFile(file: ServiceFile): CaptureFile {
  return {
    key: file.id,
    id: file.id,
    name: file.name,
    url: file.url,
    preview: file.type.startsWith('image/') ? file.url : null,
    uploading: false,
  };
}

// --- Draft: a capture whose save failed survives a reload -----------------

interface StoredDraft {
  form: CaptureForm;
  files: Pick<CaptureFile, 'key' | 'id' | 'name'>[];
}

const draftKey = computed(() => `finance.captureDraft.${eventId() ?? ''}`);

function storeDraft() {
  try {
    const draft: StoredDraft = {
      form: { ...form, payer: { ...form.payer } },
      // Uploaded files stay attachable for this session; the rest are lost.
      files: files.value
        .filter((f) => f.id)
        .map(({ key, id, name }) => ({ key, id, name })),
    };
    localStorage.setItem(draftKey.value, JSON.stringify(draft));
  } catch {
    // Storage may be unavailable (private mode); the form still holds it.
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(draftKey.value);
  } catch {
    // Nothing stored.
  }
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(draftKey.value);
    if (!raw) {
      return;
    }
    const draft = JSON.parse(raw) as StoredDraft;
    Object.assign(form, draft.form);
    files.value = draft.files.map((f) => ({
      ...f,
      url: null,
      preview: null,
      uploading: false,
    }));
    showOriginal.value = !!draft.form.originalCurrency;
    restored.value = true;
  } catch {
    clearDraft();
  }
}

function discardDraft() {
  clearDraft();
  restored.value = false;
  Object.assign(form, emptyForm());
  files.value = [];
}

if (!expense) {
  restoreDraft();
}

// --- Photos ---------------------------------------------------------------

function pickFile() {
  fileInput.value?.click();
}

function onFilesPicked(event: Event) {
  const input = event.target as HTMLInputElement;
  for (const file of Array.from(input.files ?? [])) {
    void upload(file);
  }
  input.value = '';
}

async function upload(file: File) {
  const key = `${Date.now().toString()}-${file.name}`;
  const url = URL.createObjectURL(file);
  files.value.push({
    key,
    id: null,
    name: file.name,
    url,
    preview: file.type.startsWith('image/') ? url : null,
    uploading: true,
  });

  const entry = () => files.value.find((f) => f.key === key);
  try {
    const uploaded = await api.createTemporaryFile({ file });
    const current = entry();
    if (current) {
      current.id = uploaded.id;
      current.uploading = false;
    }
  } catch {
    removeFile(key);
    quasar.notify({
      type: 'negative',
      message: t('finance.capture.uploadFailed'),
    });
  }
}

function openFile(file: CaptureFile) {
  if (file.url) {
    openURL(file.url);
  }
}

function removeFile(key: string) {
  const file = files.value.find((f) => f.key === key);
  if (file?.url?.startsWith('blob:')) {
    URL.revokeObjectURL(file.url);
  }
  files.value = files.value.filter((f) => f.key !== key);
}

onBeforeUnmount(() => {
  for (const file of files.value) {
    if (file.url?.startsWith('blob:')) {
      URL.revokeObjectURL(file.url);
    }
  }
});

function addCurrency(value: string, done: (item?: string) => void) {
  const code = value.trim().toUpperCase();
  done(/^[A-Z]{3}$/.test(code) ? code : undefined);
}

// --- Saving ---------------------------------------------------------------

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
    type: form.type,
    amount: form.amount,
    ...original,
    date: form.date,
    description: form.description.trim(),
    categoryId: form.categoryId,
    paidByUserId: form.payer.userId,
    paidByName: form.payer.userId ? null : form.payer.name,
    fileIds: files.value.flatMap((f) => (f.id ? [f.id] : [])),
  };

  saving.value = true;
  try {
    if (expense) {
      onDialogOK(await financeStore.updateExpense(expense.id, data));
      return;
    }

    const created = await financeStore.createExpense(data);
    clearDraft();
    restored.value = false;
    saved.value = created;
  } catch {
    // Reported by the store; keep everything for another try.
    if (!expense) {
      storeDraft();
    }
  } finally {
    saving.value = false;
  }
}

function confirmDelete() {
  if (!expense) {
    return;
  }
  quasar
    .dialog({
      component: ConfirmDialog,
      componentProps: {
        title: t('finance.delete.title', { number: expense.receiptNumber }),
        message: t('finance.delete.message'),
        okLabel: t('finance.delete.ok'),
        color: 'negative',
      },
    })
    .onOk(() => {
      void financeStore.deleteExpense(expense.id).then(() => onDialogOK());
    });
}

// The payer and date usually stay the same across a stack of receipts.
function startNext() {
  const { payer, date } = form;
  saved.value = null;
  Object.assign(form, emptyForm(), { payer, date });
  files.value = [];
  showOriginal.value = false;
}
</script>

<style scoped>
.receipt-mono {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}

.receipt-tag {
  gap: 8px;
  padding: 24px 16px;
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.receipt-number {
  font-size: 64px;
  font-weight: 700;
  line-height: 1.1;
}

.amount {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.photo-entry {
  width: 88px;
  gap: 4px;
}

.photo-tile {
  position: relative;
  width: 88px;
  height: 88px;
  overflow: hidden;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}

.photo-open {
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
}

.photo-open:disabled {
  cursor: default;
}

.photo-name {
  max-width: 100%;
}

.photo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-state {
  position: absolute;
}

.photo-remove {
  position: absolute;
  top: 4px;
  right: 4px;
}

.original-currency {
  width: 112px;
  flex: 0 0 auto;
}

.type-toggle :deep(.q-btn) {
  min-height: 44px;
}
</style>
