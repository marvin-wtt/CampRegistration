<template>
  <!-- Danger treatment: an error accent and a faint error tint, rather than a
       fully red card. Shared by every destructive or blocked-state section. -->
  <q-card
    flat
    class="danger-card"
    :class="{ 'danger-card--strip': strip }"
  >
    <template v-if="strip">
      <q-icon
        :name="icon"
        size="20px"
        class="text-error"
      />
      <div class="col ellipsis">
        <slot />
      </div>
      <slot name="side" />
    </template>

    <template v-else>
      <q-card-section class="row items-start no-wrap q-gutter-sm">
        <danger-icon :name="icon" />
        <div class="col">
          <slot />
        </div>
        <slot name="side" />
      </q-card-section>

      <q-card-section
        v-if="$slots.body"
        class="q-pt-none"
      >
        <slot name="body" />
      </q-card-section>

      <q-card-actions
        v-if="$slots.actions"
        class="q-pt-none q-px-md q-pb-md"
      >
        <slot name="actions" />
      </q-card-actions>
    </template>
  </q-card>
</template>

<script lang="ts" setup>
import DangerIcon from '@/components/common/DangerIcon.vue';

defineProps<{
  icon: string;
  /** One-line variant for places that cannot spare the full card's height. */
  strip?: boolean;
}>();
</script>

<style lang="scss" scoped>
.danger-card {
  border-radius: 16px;
  border-left: 4px solid var(--md3-error);
  background: color-mix(in srgb, var(--md3-error) 6%, var(--md3-surface));
}

.danger-card--strip {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 12px;
}
</style>
