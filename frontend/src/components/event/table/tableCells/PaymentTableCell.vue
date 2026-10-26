<template>
  <!-- One line: the status, then what is still open (or what was paid). -->
  <span
    v-if="payment && payment.status !== 'NOT_REQUIRED'"
    class="payment-cell"
  >
    <payment-status-chip
      :status="payment.status"
      :dense="cellProps.dense"
    />
    <span
      v-if="!cellProps.dense && payment.amountDue !== null"
      class="payment-cell__amount"
    >
      {{
        payment.outstanding > 0
          ? t('open', { amount: money(payment.outstanding) })
          : money(payment.amountPaid)
      }}
    </span>
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatMoney } from '@camp-registration/common/utils';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';
import PaymentStatusChip from '@/components/event/payment/PaymentStatusChip.vue';

const { props: cellProps } = defineProps<TableCellProps>();

const { t, locale } = useI18n();

// Always the row's own ledger summary, whatever path the column names.
const payment = computed(() => cellProps.row.payment);

function money(minor: number): string {
  return formatMoney(minor, payment.value.currency, locale.value);
}
</script>

<style scoped>
.payment-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.payment-cell__amount {
  color: var(--md3-on-surface-variant);
  font-variant-numeric: tabular-nums;
}
</style>

<i18n lang="yaml" locale="en">
open: '{amount} open'
</i18n>

<i18n lang="yaml" locale="de">
open: '{amount} offen'
</i18n>

<i18n lang="yaml" locale="fr">
open: '{amount} à payer'
</i18n>

<i18n lang="yaml" locale="pl">
open: 'Do zapłaty: {amount}'
</i18n>

<i18n lang="yaml" locale="cs">
open: 'Nezaplaceno: {amount}'
</i18n>
