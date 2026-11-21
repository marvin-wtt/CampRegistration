<script setup lang="ts">
interface Props {
  primaryColor: string;
  primaryTint: string;
  label?: string;
  padding?: string;
}

withDefaults(defineProps<Props>(), { padding: '28px 40px 0' });
</script>

<template>
  <mj-text :padding="padding">
    <div
      :style="`background-color: ${primaryTint}; border-left: 3px solid ${primaryColor}; border-radius: 12px; padding: 16px 20px; font-size: 14px; line-height: 1.6; color: #334155; text-align: left;`"
    >
      <strong
        v-if="label"
        style="display: block; margin-bottom: 4px; color: #0f172a"
        >{{ label }}</strong
      >
      <slot />
    </div>
  </mj-text>
</template>
