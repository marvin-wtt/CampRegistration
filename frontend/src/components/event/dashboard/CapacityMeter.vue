<template>
  <div
    class="capacity-meter"
    role="progressbar"
    :aria-label="label"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="Math.round(ratio * 100)"
  >
    <div
      class="capacity-meter__fill"
      :class="`capacity-meter__fill--${tone}`"
      :style="{ width: `${ratio * 100}%` }"
    />
  </div>
</template>

<script lang="ts" setup>
const { tone = 'primary' } = defineProps<{
  ratio: number;
  label: string;
  tone?: 'primary' | 'warning' | 'error';
}>();
</script>

<style scoped>
.capacity-meter {
  height: 8px;
  overflow: hidden;
  background: var(--md3-surface-container-highest);
  border-radius: 999px;
}

.capacity-meter__fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.3s ease;
}

.capacity-meter__fill--primary {
  background: var(--md3-primary);
}

.capacity-meter__fill--warning {
  background: var(--md3-warning);
}

.capacity-meter__fill--error {
  background: var(--md3-error);
}
</style>
