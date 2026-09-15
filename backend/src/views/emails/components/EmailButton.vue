<script setup lang="ts">
interface Props {
  primaryColor: string;
  href: string;
  cssClass?: string;
}

defineProps<Props>();
</script>

<template>
  <mj-button
    :background-color="primaryColor"
    color="#ffffff"
    font-size="15px"
    font-weight="600"
    border-radius="6px"
    padding="0 36px"
    inner-padding="14px 28px"
    :href="href"
    :css-class="cssClass"
  >
    <slot />
  </mj-button>
</template>
