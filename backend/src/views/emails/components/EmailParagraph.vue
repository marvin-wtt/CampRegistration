<script setup lang="ts">
interface Props {
  padding?: string;
}

withDefaults(defineProps<Props>(), { padding: '0 36px 28px' });
</script>

<template>
  <mj-text
    font-size="15px"
    line-height="1.7"
    color="#374151"
    :padding="padding"
  >
    <slot />
  </mj-text>
</template>
