<script setup lang="ts">
interface Props {
  html: string;
}

defineProps<Props>();
</script>

<template>
  <mj-text
    font-size="16px"
    line-height="1.7"
    color="#1e293b"
    padding="0 40px"
    css-class="body-text"
  >
    <div v-html="html" />
  </mj-text>
</template>
