<template>
  <div
    v-if="logo && !logoFailed"
    class="event-avatar event-avatar--logo"
    :style="{ '--avatar-size': `${size}px` }"
  >
    <img
      class="event-avatar__logo"
      :src="logo"
      alt=""
      aria-hidden="true"
      loading="lazy"
      @error="logoFailed = true"
    />
  </div>
  <div
    v-else
    class="event-avatar"
    :class="`event-avatar--${eventTone(eventId)}`"
    :style="{ '--avatar-size': `${size}px` }"
    aria-hidden="true"
  >
    {{ monogram }}
  </div>
</template>

<script lang="ts">
const tones = ['primary', 'secondary', 'tertiary'] as const;

/** A stable tone per event, so its avatar looks the same everywhere. */
export function eventTone(eventId: string): (typeof tones)[number] {
  const hash = [...eventId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tones[hash % tones.length] ?? 'primary';
}
</script>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

const {
  eventId,
  name,
  logo = null,
  size = 44,
} = defineProps<{
  eventId: string;
  name: string;
  logo?: string | null;
  size?: number;
}>();

const monogram = computed<string>(
  () => name.trim().charAt(0).toUpperCase() || '•',
);

// The URL points at a slot, not a file: the file can be gone while the avatar
// is on screen. Falling back to the monogram beats a broken-image icon.
const logoFailed = ref(false);

watch(
  () => logo,
  () => {
    logoFailed.value = false;
  },
);
</script>

<style scoped>
.event-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--avatar-size);
  height: var(--avatar-size);
  overflow: hidden;
  border-radius: calc(var(--avatar-size) * 0.27);
  font-size: calc(var(--avatar-size) * 0.5);
  font-weight: 700;
  line-height: 1;
  user-select: none;
}

.event-avatar--primary {
  color: var(--md3-on-primary-container);
  background: var(--md3-primary-container);
}

.event-avatar--secondary {
  color: var(--md3-on-secondary-container);
  background: var(--md3-secondary-container);
}

.event-avatar--tertiary {
  color: var(--md3-on-tertiary-container);
  background: var(--md3-tertiary-container);
}

/* A logo brings its own colors, so it sits on a neutral plate. */
.event-avatar--logo {
  background: var(--md3-surface-container-highest);
  border: 1px solid var(--md3-outline-variant);
}

.event-avatar__logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
