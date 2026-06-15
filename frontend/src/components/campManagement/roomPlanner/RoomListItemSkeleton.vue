<template>
  <div class="bed-row-skeleton">
    <q-skeleton
      type="circle"
      size="32px"
    />
    <q-skeleton
      type="text"
      class="bed-row-skeleton__name"
      :width="nameWidth"
    />
  </div>
</template>

<script lang="ts" setup>
const { nameWidth = '60%' } = defineProps<{
  nameWidth?: string;
}>();
</script>

<style scoped>
.bed-row-skeleton {
  display: flex;
  align-items: center;
  gap: 10px;

  min-height: 44px;
  padding: 6px 8px;
}

.bed-row-skeleton__name {
  font-size: 14px;
}
</style>
