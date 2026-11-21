<script setup lang="ts">
interface Props {
  sentTo: string;
  reason?: string;
}

defineProps<Props>();
</script>

<template>
  <mj-section
    background-color="#ffffff"
    border-radius="0 0 16px 16px"
    padding="0 0 28px"
  >
    <mj-column>
      <mj-divider
        border-color="#e2e8f0"
        border-width="1px"
        padding="0 32px 20px"
      />
      <mj-text
        align="center"
        font-size="13px"
        line-height="1.7"
        color="#64748b"
        padding="0 32px"
        css-class="email-footer"
      >
        {{ sentTo }}
        <br />
        <template v-if="reason">{{ reason }}</template>
        <slot name="extra" />
      </mj-text>
    </mj-column>
  </mj-section>
</template>
