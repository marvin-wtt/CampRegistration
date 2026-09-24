<template>
  <div
    v-if="payment && payment.status !== 'NOT_REQUIRED'"
    class="column items-center"
  >
    <payment-status-chip
      :status="payment.status"
      :dense="cellProps.dense"
    />
    <span
      v-if="!cellProps.dense && payment.amountDue !== null"
      class="text-caption payment-cell__amount"
    >
      {{ money(payment.amountPaid) }} / {{ money(payment.amountDue) }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatMoney } from '@camp-registration/common/utils';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';
import PaymentStatusChip from '@/components/event/payment/PaymentStatusChip.vue';

const { props: cellProps } = defineProps<TableCellProps>();

const { locale } = useI18n();

// Always the row's own ledger summary, whatever path the column names.
const payment = computed(() => cellProps.row.payment);

function money(minor: number): string {
  return formatMoney(minor, payment.value.currency, locale.value);
}
</script>

<style scoped>
.payment-cell__amount {
  color: var(--md3-on-surface-variant);
}
</style>
