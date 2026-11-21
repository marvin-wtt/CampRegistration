<script setup lang="ts">
interface Props {
  primaryColor: string;
  appName: string;
  subtitle?: string;
}

defineProps<Props>();
</script>

<template>
  <mj-section
    :background-color="primaryColor"
    border-radius="16px 16px 0 0"
    padding="24px 32px"
  >
    <mj-column>
      <mj-text
        font-size="22px"
        font-weight="700"
        color="#ffffff"
        letter-spacing="0.2px"
        padding="0"
      >
        {{ appName }}
      </mj-text>
      <mj-text
        v-if="subtitle"
        font-size="15px"
        color="rgba(255,255,255,0.85)"
        padding="4px 0 0"
      >
        {{ subtitle }}
      </mj-text>
    </mj-column>
  </mj-section>
</template>
