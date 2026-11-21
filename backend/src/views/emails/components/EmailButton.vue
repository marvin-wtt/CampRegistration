<script setup lang="ts">
interface Props {
  primaryColor: string;
  href: string;
  cssClass?: string;
  align?: 'left' | 'center';
}

withDefaults(defineProps<Props>(), { align: 'center' });
</script>

<template>
  <mj-button
    :align="align"
    :background-color="primaryColor"
    color="#ffffff"
    font-size="16px"
    font-weight="700"
    border-radius="10px"
    padding="4px 40px 0"
    inner-padding="16px 36px"
    :href="href"
    :css-class="cssClass"
  >
    <slot />
  </mj-button>
</template>
