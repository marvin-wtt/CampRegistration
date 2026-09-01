<template>
  <!-- Which of the two authors an entry came from. Rendered next to the entry
       rather than as a separate list, because the question an author has is
       always about one specific line: "did we already say this?" -->
  <q-chip
    v-if="origin"
    dense
    square
    :class="`origin-chip origin-chip--${origin}`"
  >
    {{ t(`privacy.editor.origin.${origin}`) }}
  </q-chip>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

defineProps<{
  /** `null` renders nothing, so a caller can pass a row's state straight in. */
  origin: 'organization' | 'event' | null;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<style lang="scss" scoped>
.origin-chip {
  font-size: 0.7rem;

  &--organization {
    background-color: var(--md3-surface-container-high);
    color: var(--md3-on-surface-variant);
  }

  &--event {
    background-color: var(--md3-primary-container);
    color: var(--md3-on-primary-container);
  }
}
</style>
