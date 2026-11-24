<template>
  <!-- The column every finance tab is laid out in. Flex gap, not q-gutter:
       a gutter's negative margins push its children past the page edge. -->
  <div
    class="finance-tab column no-wrap"
    :class="{
      'finance-tab--loose': loose,
      'finance-tab--xs': quasar.screen.xs,
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar';

const { loose = false } = defineProps<{
  /** More room between sections, for tabs of cards rather than one list. */
  loose?: boolean;
}>();

const quasar = useQuasar();
</script>

<style scoped>
.finance-tab {
  gap: 16px;
}

.finance-tab--xs {
  gap: 8px;
}

.finance-tab--loose {
  gap: 24px;
}
</style>
