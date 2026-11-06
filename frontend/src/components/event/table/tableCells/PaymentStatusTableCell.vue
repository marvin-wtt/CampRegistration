<template>
  <payment-status-chip
    v-if="status && status !== 'NOT_REQUIRED'"
    :status
    :dense="cellProps.dense"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { RegistrationPaymentStatus } from '@camp-registration/common/entities';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';
import PaymentStatusChip from '@/components/event/payment/PaymentStatusChip.vue';

const { props: cellProps } = defineProps<TableCellProps>();

const status = computed(
  () => cellProps.value as RegistrationPaymentStatus | null | undefined,
);
</script>
