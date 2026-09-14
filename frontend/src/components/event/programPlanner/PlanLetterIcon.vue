<template>
  <span
    class="plan-letter-icon"
    :style="{ fontSize: size }"
  >
    {{ plan === 'a' ? 'A' : 'B' }}
  </span>
</template>

<script lang="ts" setup>
/**
 * A drop-in replacement for a `<q-icon :size>` showing which plan (a/b) an
 * item belongs to — plain letters rather than a weather-themed glyph (was
 * `wb_sunny`/`water_drop`), so plan labels stay meaningful for any use of the
 * a/b split, not just a fair/bad-weather contingency.
 */
const { plan, size = '1em' } = defineProps<{
  plan: 'a' | 'b';
  size?: string;
}>();
</script>

<style lang="scss" scoped>
.plan-letter-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-weight: 700;
}
</style>
