<script setup lang="ts">
interface Props {
  padding?: string;
  align?: 'left' | 'center';
  muted?: boolean;
}

withDefaults(defineProps<Props>(), { padding: '0 40px 28px', align: 'left' });
</script>

<template>
  <mj-text
    :align="align"
    font-size="16px"
    line-height="1.65"
    :color="muted ? '#64748b' : '#334155'"
    :padding="padding"
  >
    <slot />
  </mj-text>
</template>
