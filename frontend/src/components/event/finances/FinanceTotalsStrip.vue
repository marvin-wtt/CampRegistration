<template>
  <!-- The figures that lead a finance tab, on one neutral surface. -->
  <div
    class="totals-strip rounded-xl"
    :class="[
      dense ? 'q-pl-md q-pr-sm q-py-sm' : 'q-px-lg q-py-md',
      { 'totals-strip--alert': alert },
    ]"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
const { dense = false, alert = false } = defineProps<{
  /** Tighter, for a single line on phones. */
  dense?: boolean;
  /** Outlined in warning: something is owed to the event. */
  alert?: boolean;
}>();
</script>

<style scoped>
.totals-strip {
  background: var(--md3-surface-container);
}

.totals-strip--alert {
  box-shadow: inset 0 0 0 1px var(--md3-warning);
}
</style>
