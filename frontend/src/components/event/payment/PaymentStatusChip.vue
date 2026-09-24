<template>
  <span
    class="payment-status-chip"
    :class="{ 'payment-status-chip--dense': dense }"
    :style="style"
    :data-test="`payment-status-${status}`"
  >
    <q-icon
      :name="icon"
      size="14px"
    />
    {{ t(`status.${status}`) }}
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RegistrationPaymentStatus } from '@camp-registration/common/entities';

const { status, dense = false } = defineProps<{
  status: RegistrationPaymentStatus;
  dense?: boolean;
}>();

const { t } = useI18n();

// MD3 color role per status, rendered with the role's container tokens.
const ROLES: Record<RegistrationPaymentStatus, string> = {
  PAID: 'positive',
  PARTIAL: 'warning',
  UNPAID: 'error',
  REFUNDED: 'info',
  NOT_REQUIRED: 'surface-variant',
};

const ICONS: Record<RegistrationPaymentStatus, string> = {
  PAID: 'check_circle',
  PARTIAL: 'timelapse',
  UNPAID: 'schedule',
  REFUNDED: 'undo',
  NOT_REQUIRED: 'remove',
};

const icon = computed(() => ICONS[status]);

const style = computed(() => {
  const role = ROLES[status];
  if (role === 'surface-variant') {
    return {
      backgroundColor: 'var(--md3-surface-variant)',
      color: 'var(--md3-on-surface-variant)',
    };
  }

  return {
    backgroundColor: `var(--md3-${role}-container)`,
    color: `var(--md3-on-${role}-container)`,
  };
});
</script>

<style scoped>
.payment-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.payment-status-chip--dense {
  height: 18px;
  padding: 0 8px;
  font-size: 11px;
}
</style>

<i18n lang="yaml" locale="en">
status:
  PAID: 'Paid'
  PARTIAL: 'Partially paid'
  UNPAID: 'Unpaid'
  REFUNDED: 'Refunded'
  NOT_REQUIRED: 'No payment'
</i18n>

<i18n lang="yaml" locale="de">
status:
  PAID: 'Bezahlt'
  PARTIAL: 'Teilweise bezahlt'
  UNPAID: 'Offen'
  REFUNDED: 'Erstattet'
  NOT_REQUIRED: 'Keine Zahlung'
</i18n>

<i18n lang="yaml" locale="fr">
status:
  PAID: 'Payé'
  PARTIAL: 'Partiellement payé'
  UNPAID: 'Impayé'
  REFUNDED: 'Remboursé'
  NOT_REQUIRED: 'Pas de paiement'
</i18n>

<i18n lang="yaml" locale="pl">
status:
  PAID: 'Opłacone'
  PARTIAL: 'Częściowo opłacone'
  UNPAID: 'Nieopłacone'
  REFUNDED: 'Zwrócone'
  NOT_REQUIRED: 'Bez płatności'
</i18n>

<i18n lang="yaml" locale="cs">
status:
  PAID: 'Zaplaceno'
  PARTIAL: 'Částečně zaplaceno'
  UNPAID: 'Nezaplaceno'
  REFUNDED: 'Vráceno'
  NOT_REQUIRED: 'Bez platby'
</i18n>
