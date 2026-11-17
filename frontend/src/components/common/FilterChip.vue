<template>
  <!-- The compact MD3 filter chip: outlined, tonal once active. Attributes
       such as `icon`, `clickable` or `removable` pass on to the chip. -->
  <q-chip
    class="filter-chip"
    :class="{ 'filter-chip--active': active }"
  >
    <slot />
  </q-chip>
</template>

<script lang="ts" setup>
const { active = false } = defineProps<{ active?: boolean }>();
</script>

<style scoped>
.filter-chip {
  height: 32px;
  margin: 0;
  padding: 0 12px;
  flex: 0 0 auto;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 8px;
  background: transparent;
  color: var(--md3-on-surface-variant);
  font-size: 13px;
  font-weight: 500;
}

.filter-chip--active {
  border-color: transparent;
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}
</style>
