<template>
  <!-- One fact of a details dialog: icon, what it is, its value. The side
       slot holds the step that changes it. Attributes such as `clickable`
       or `href` pass on to the item. -->
  <q-item>
    <q-item-section avatar>
      <q-icon
        :name="icon"
        :color="tone ?? (warn ? 'warning' : 'on-surface-variant')"
      />
    </q-item-section>
    <q-item-section>
      <q-item-label
        v-if="label"
        caption
      >
        {{ label }}
      </q-item-label>
      <q-item-label
        class="ellipsis"
        :class="valueClass"
      >
        <slot>{{ value }}</slot>
      </q-item-label>
    </q-item-section>
    <q-item-section
      v-if="$slots.side"
      side
    >
      <slot name="side" />
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const {
  icon,
  label = undefined,
  value = undefined,
  tone = undefined,
  warn = false,
} = defineProps<{
  icon: string;
  label?: string | undefined;
  value?: string | undefined;
  /** The icon's color role; muted by default. */
  tone?: string | undefined;
  /** Something is missing: icon and value in warning. */
  warn?: boolean;
}>();

const valueClass = computed(() => (warn ? 'text-warning' : ''));
</script>
