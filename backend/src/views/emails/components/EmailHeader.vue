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
    v-if="subtitle"
    :background-color="primaryColor"
    padding="18px 0 20px"
  >
    <mj-column>
      <mj-text
        align="center"
        font-size="13px"
        font-weight="400"
        color="rgba(255,255,255,0.75)"
        padding="0 24px 2px"
      >
        {{ appName }}
      </mj-text>
      <mj-text
        align="center"
        font-size="18px"
        font-weight="700"
        color="#ffffff"
        padding="0 24px"
      >
        {{ subtitle }}
      </mj-text>
    </mj-column>
  </mj-section>
  <mj-section
    v-else
    :background-color="primaryColor"
    padding="22px 0"
  >
    <mj-column>
      <mj-text
        align="center"
        font-size="17px"
        font-weight="600"
        color="#ffffff"
        letter-spacing="0.2px"
      >
        {{ appName }}
      </mj-text>
    </mj-column>
  </mj-section>
</template>
