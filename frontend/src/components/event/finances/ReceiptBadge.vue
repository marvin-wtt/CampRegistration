<template>
  <!-- A receipt's number as written on the paper; still to come in warning. -->
  <div
    class="receipt-badge text-mono rounded-md column items-center justify-center"
    :class="{ 'receipt-badge--pending': pending }"
  >
    <q-icon
      v-if="pending"
      name="hourglass_empty"
      size="14px"
    >
      <q-tooltip>{{ pendingLabel ?? t('finance.receiptPending') }}</q-tooltip>
    </q-icon>
    {{ label ?? `#${(number ?? 0).toString()}` }}
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const {
  number = undefined,
  label = undefined,
  pending = false,
  pendingLabel = undefined,
} = defineProps<{
  number?: number;
  /** Shown instead of `#number`, e.g. an income's `I3`. */
  label?: string | undefined;
  /** No date yet: the receipt is still to come. */
  pending?: boolean;
  /** What pending means here; a receipt's wording otherwise. */
  pendingLabel?: string | undefined;
}>();

const { t } = useI18n();
</script>

<style scoped>
.receipt-badge {
  flex: none;
  width: 44px;
  height: 44px;
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
  font-size: 13px;
  font-weight: 500;
}

.receipt-badge--pending {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);
}
</style>
