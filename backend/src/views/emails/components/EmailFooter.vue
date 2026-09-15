<script setup lang="ts">
interface Props {
  sentTo: string;
  reason?: string;
}

defineProps<Props>();
</script>

<template>
  <mj-section
    background-color="#f3f4f6"
    padding="24px 0 36px"
  >
    <mj-column width="78%">
      <mj-text
        align="center"
        font-size="12px"
        line-height="1.7"
        color="#6b7280"
      >
        {{ sentTo }}
        <br />
        <template v-if="reason">{{ reason }}</template>
        <slot name="extra" />
      </mj-text>
    </mj-column>
  </mj-section>
</template>
