<template>
  <div class="public-program-item-skeleton">
    <q-skeleton
      type="text"
      width="48px"
      class="public-program-item-skeleton__time"
    />
    <q-skeleton
      type="text"
      :width="titleWidth"
    />
  </div>
</template>

<script lang="ts" setup>
const { titleWidth = '70%' } = defineProps<{
  titleWidth?: string;
}>();
</script>

<style lang="scss" scoped>
.public-program-item-skeleton {
  min-width: 0;
  border-left: 4px solid var(--md3-outline-variant);
  border-radius: 8px;
  padding: 8px 12px;
  background-color: var(--md3-surface-container-low);

  &__time {
    margin-bottom: 6px;
  }
}
</style>
