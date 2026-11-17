<template>
  <!-- A details dialog's lead: the amount, then what it is. -->
  <div class="column items-center text-center q-py-sm">
    <div class="text-h4 text-amount">{{ amount }}</div>
    <div class="text-body1 text-on-surface-variant">{{ caption }}</div>
  </div>
</template>

<script lang="ts" setup>
const { amount, caption } = defineProps<{
  /** Already formatted. */
  amount: string;
  caption: string;
}>();
</script>
