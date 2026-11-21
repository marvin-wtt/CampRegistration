<script setup lang="ts">
interface Props {
  align?: 'left' | 'center';
}

withDefaults(defineProps<Props>(), { align: 'left' });
</script>

<template>
  <mj-text
    :align="align"
    font-size="26px"
    font-weight="700"
    line-height="1.3"
    color="#0f172a"
    padding="0 40px 16px"
    css-class="email-force-dark-text"
  >
    <slot />
  </mj-text>
</template>
