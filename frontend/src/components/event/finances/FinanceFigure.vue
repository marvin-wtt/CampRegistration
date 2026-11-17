<template>
  <!-- One figure of a totals strip: what it is, then the amount. -->
  <div class="column">
    <span class="text-caption text-on-surface-variant ellipsis">
      {{ label }}
    </span>
    <span
      class="text-amount"
      :class="[lead ? 'text-h5' : 'text-h6', toneClass]"
    >
      {{ value }}
    </span>
    <span
      v-if="$slots.default"
      class="text-caption text-on-surface-variant"
    >
      <slot />
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const {
  label,
  value,
  lead = false,
  tone = undefined,
} = defineProps<{
  label: string;
  /** Already formatted, e.g. a money amount. */
  value: string;
  /** The strip's main figure, set larger. */
  lead?: boolean;
  tone?: 'warning' | 'refund' | undefined;
}>();

const toneClass = computed(() =>
  tone === 'warning'
    ? 'text-warning'
    : tone === 'refund'
      ? 'text-tertiary'
      : '',
);
</script>
