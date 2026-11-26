<template>
  <!-- A receipt's number as written on the paper; still to come in warning. -->
  <div
    class="receipt-badge text-mono rounded-md column items-center justify-center"
    :class="{ 'receipt-badge--pending': pending }"
    :style="{ fontSize: `${fontSize.toString()}px` }"
  >
    <q-icon
      v-if="pending"
      name="hourglass_empty"
      size="14px"
    >
      <q-tooltip>{{ pendingLabel ?? t('finance.receiptPending') }}</q-tooltip>
    </q-icon>
    <span v-if="label">{{ label }}</span>
    <span v-else><span class="receipt-badge__hash">#</span>{{ text }}</span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
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

const text = computed(() => label ?? (number ?? 0).toString());

// As large as the box allows: short numbers, the common case, read at a glance.
const fontSize = computed(() => {
  const length = text.value.length;
  if (length <= 2) {
    return pending ? 16 : 19;
  }
  if (length === 3) {
    return pending ? 14 : 16;
  }
  return length === 4 ? 13 : 11;
});
</script>

<style scoped>
.receipt-badge {
  flex: none;
  width: 44px;
  height: 44px;
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
  font-weight: 500;
  line-height: 1.1;
}

.receipt-badge__hash {
  font-size: 0.65em;
  opacity: 0.7;
}

.receipt-badge--pending {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);
}
</style>
