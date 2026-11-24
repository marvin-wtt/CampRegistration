<template>
  <q-badge
    :color="tone.color"
    :text-color="tone.text"
    :label="t(`finance.fee.status.${status}`)"
    data-test="payment-status"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PaymentBalanceStatus } from '@camp-registration/common/entities';

const { status } = defineProps<{ status: PaymentBalanceStatus }>();

const { t } = useI18n();

// Warning while money is owed; tertiary for an excess to give back.
const TONES: Record<PaymentBalanceStatus, { color: string; text: string }> = {
  UNPAID: { color: 'warning-container', text: 'on-warning-container' },
  PARTIAL: { color: 'warning-container', text: 'on-warning-container' },
  PAID: { color: 'positive-container', text: 'on-positive-container' },
  OVERPAID: { color: 'tertiary-container', text: 'on-tertiary-container' },
  REFUNDED: { color: 'surface-container-highest', text: 'on-surface-variant' },
  NOT_REQUIRED: {
    color: 'surface-container-highest',
    text: 'on-surface-variant',
  },
};

const tone = computed(() => TONES[status]);
</script>
