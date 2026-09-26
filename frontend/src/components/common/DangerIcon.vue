<template>
  <div class="danger-icon row items-center justify-center">
    <q-icon
      :name
      size="22px"
      class="text-error"
    />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  name: string;
}>();
</script>

<style lang="scss" scoped>
.danger-icon {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border-radius: 13px;
  background: color-mix(in srgb, var(--md3-error) 12%, transparent);
}
</style>
