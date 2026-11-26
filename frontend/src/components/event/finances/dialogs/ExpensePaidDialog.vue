<template>
  <!-- An invoice paid after it arrived: when, usually today. -->
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="
        expense.type === 'REFUND'
          ? t('finance.action.markReceived')
          : t('finance.action.markPaid')
      "
      :subtitle="`#${expense.receiptNumber.toString()} · ${expense.description}`"
      icon="price_check"
      :width="400"
      @submit="save"
      @cancel="onDialogCancel"
    >
      <event-date-input
        v-model="paidOn"
        :label="
          expense.type === 'REFUND'
            ? t('finance.field.refundReceivedOn')
            : t('finance.field.paidOn')
        "
        :max="today"
        open-on-today
        data-test="expense-paid-on"
      />

      <template #actions>
        <m-btn
          :label="t('finance.action.cancel')"
          text
          rounded
          color="primary"
          @click="onDialogCancel"
        />
        <m-btn
          :label="t('finance.action.save')"
          :loading="saving"
          :disable="!paidOn"
          rounded
          color="primary"
          type="submit"
          data-test="expense-paid-save"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Expense } from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import EventDateInput from '@/components/event/EventDateInput.vue';
import { useConfirmStatementChange } from '@/composables/payoutStatements';
import { useFinanceStore } from '@/stores/finance-store';
import { formatLocalDate } from '@/utils/date';

const { expense } = defineProps<{ expense: Expense }>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { t } = useI18n();
const financeStore = useFinanceStore();
const confirmStatementChange = useConfirmStatementChange();

const today = formatLocalDate(new Date());
const paidOn = ref<string | null>(today);
const saving = ref(false);

async function save() {
  if (!paidOn.value) {
    return;
  }
  // Now on its payer's balance: their current statement may change.
  if (
    !(await confirmStatementChange(expense, {
      ...expense,
      paidOn: paidOn.value,
    }))
  ) {
    return;
  }
  saving.value = true;
  try {
    onDialogOK(
      await financeStore.updateExpense(expense.id, { paidOn: paidOn.value }),
    );
  } catch {
    // Reported by the store; the dialog stays open for another try.
  } finally {
    saving.value = false;
  }
}
</script>
