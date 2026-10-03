<template>
  <q-chip
    :icon
    :removable
    class="file-chip"
    @remove="emit('remove')"
  >
    <span class="file-chip__name">{{ name }}</span>
    <q-tooltip>{{ name }}</q-tooltip>
  </q-chip>
</template>

<script lang="ts" setup>
/**
 * A file name in a file input, shortened with an ellipsis when it doesn't fit
 * and shown in full on hover.
 */
const {
  name,
  icon,
  removable = false,
} = defineProps<{
  name: string;
  icon?: string;
  removable?: boolean;
}>();

const emit = defineEmits<{
  remove: [];
}>();
</script>

<style scoped lang="scss">
// Flex items don't shrink below their content by default, which would let a
// long name push the chip out of the field before the ellipsis applies.
.file-chip {
  max-width: 100%;
  min-width: 0;

  :deep(.q-chip__content) {
    min-width: 0;
  }
}

.file-chip__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
