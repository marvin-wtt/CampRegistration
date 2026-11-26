<template>
  <!-- What a receipt is. It stays open: editing opens on top and returns. -->
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="expense.description"
      no-form
      closable
      @cancel="onDialogCancel"
    >
      <template #avatar>
        <receipt-badge
          :number="expense.receiptNumber"
          :pending="!expense.date"
          class="q-mr-md"
        />
      </template>
      <template
        v-if="menu.length > 0"
        #header-actions
      >
        <responsive-menu
          :items="menu"
          :label="t('finance.expenseDetails.actions')"
          :title="`#${expense.receiptNumber.toString()} · ${expense.description}`"
        />
      </template>

      <div class="column no-wrap q-gutter-y-sm">
        <finance-hero
          :amount="signedMoney(expense)"
          :caption="caption"
        />

        <q-list>
          <detail-row
            :icon="expense.date ? 'event' : 'hourglass_empty'"
            :label="t('finance.field.receiptDate')"
            :value="
              expense.date
                ? d(parseLocalDate(expense.date), 'date')
                : t('finance.receiptPending')
            "
            :warn="!expense.date"
          />
          <!-- An invoice still to pay is flagged; marking it paid is at hand. -->
          <detail-row
            :icon="expense.paidOn ? 'price_check' : 'schedule'"
            :label="
              expense.type === 'REFUND'
                ? t('finance.field.refundReceivedOn')
                : t('finance.field.paidOn')
            "
            :value="paidValue"
            :warn="!expense.paidOn"
          >
            <template
              v-if="actions.markPaid"
              #side
            >
              <m-btn
                :label="actions.markPaid.label"
                color="primary"
                text
                rounded
                no-caps
                data-test="expense-details-mark-paid"
                @click="actions.markPaid.onClick()"
              />
            </template>
          </detail-row>
          <detail-row
            icon="person"
            :label="payerLabel"
            :value="payerName(expense)"
          />
          <detail-row
            v-if="expense.vendor"
            icon="storefront"
            :label="
              expense.type === 'REFUND'
                ? t('finance.field.vendorRefund')
                : t('finance.field.vendor')
            "
            :value="expense.vendor"
          />
          <detail-row
            v-if="category || missingCategory"
            :icon="category ? 'category' : 'label_off'"
            :label="t('finance.field.category')"
            :value="category || t('finance.noCategory')"
            :warn="missingCategory"
          />
          <detail-row
            v-if="statements"
            icon="request_quote"
            :label="t('finance.expenseDetails.statements')"
            :value="statements"
          />

          <!-- The receipt files, each opened as stored -->
          <detail-row
            v-for="file in expense.files"
            :key="file.id"
            :icon="file.type === 'application/pdf' ? 'picture_as_pdf' : 'image'"
            tone="primary"
            :label="t('finance.field.receipt')"
            :value="file.name"
            clickable
            :href="file.url"
            target="_blank"
            rel="noopener"
          >
            <template #side>
              <q-icon
                name="open_in_new"
                size="20px"
              />
            </template>
          </detail-row>
          <!-- A receipt still to come is expected to lack its file. -->
          <detail-row
            v-if="expense.files.length === 0"
            icon="no_photography"
            :label="t('finance.field.receipt')"
            :value="t('finance.noFile')"
            :warn="isMissingFile(expense)"
          />
        </q-list>
      </div>

      <template
        v-if="actions.edit"
        #actions
      >
        <m-btn
          :label="actions.edit.label"
          :icon="actions.edit.icon"
          rounded
          color="primary"
          data-test="expense-details-edit"
          @click="actions.edit.onClick()"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Expense } from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import ResponsiveMenu from '@/components/common/ResponsiveMenu.vue';
import DetailRow from '@/components/event/finances/DetailRow.vue';
import FinanceHero from '@/components/event/finances/FinanceHero.vue';
import ReceiptBadge from '@/components/event/finances/ReceiptBadge.vue';
import { useExpenseActions } from '@/composables/expenseActions';
import { useFinanceFormat } from '@/composables/financeFormat';
import { statementLabels } from '@/composables/payoutStatements';
import { useFinanceStore } from '@/stores/finance-store';
import { parseLocalDate } from '@/utils/date';
import { isMissingFile } from '@/utils/expenseState';

const { expense: opened } = defineProps<{
  /** As opened; the dialog then follows the store's copy. */
  expense: Expense;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();

const { t, d } = useI18n();
const { money, signedMoney, categoryPath, payerName } = useFinanceFormat();
const { actionsFor } = useExpenseActions();
const financeStore = useFinanceStore();

const current = computed(
  () => financeStore.expenses?.find((e) => e.id === opened.id) ?? null,
);
const expense = computed(() => current.value ?? opened);
const actions = computed(() => actionsFor(expense.value));

// Deleted, here or by someone else: nothing left to show.
watch(current, (found) => {
  if (found === null) {
    onDialogCancel();
  }
});

// Delete is destructive, so only here; Edit also has its own button.
const menu = computed(() =>
  [actions.value.markPaid, actions.value.edit, actions.value.remove].filter(
    (a) => a !== undefined,
  ),
);

const caption = computed(() => {
  const { type, originalAmount, originalCurrency } = expense.value;
  const kind =
    type === 'REFUND' ? t('finance.type.refund') : t('finance.type.expense');
  return originalAmount !== null && originalCurrency
    ? `${kind} · ${money(originalAmount, originalCurrency)}`
    : kind;
});

const category = computed(() => categoryPath(expense.value.categoryId));

const paidValue = computed(() => {
  const { paidOn, type } = expense.value;
  if (paidOn) {
    return d(parseLocalDate(paidOn), 'date');
  }
  return type === 'REFUND'
    ? t('finance.unreceivedLong')
    : t('finance.unpaidLong');
});

const payerLabel = computed(() => {
  const { paidOn, type } = expense.value;
  if (type === 'REFUND') {
    return paidOn
      ? t('finance.field.receivedBy')
      : t('finance.field.toBeReceivedBy');
  }
  return paidOn ? t('finance.field.paidBy') : t('finance.field.toBePaidBy');
});
const missingCategory = computed(() =>
  financeStore.isMissingCategory(expense.value),
);

// The payout statements this receipt is on, by label.
const statements = computed(() =>
  statementLabels(expense.value.id, financeStore.payouts, {
    includeOutdated: true,
  }),
);
</script>
