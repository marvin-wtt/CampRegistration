<template>
  <div
    class="event-cover"
    :class="[`event-cover--${tone}`, `event-cover--badge-${badgeAlign}`]"
    :style="{ aspectRatio: ratio }"
    aria-hidden="true"
  >
    <!-- Not itself clipped: the badge overlaps its bottom edge, so only the
         inner media layer (photo, tone gradient, scrim) is. -->
    <div class="event-cover__media">
      <img
        v-if="hasBanner"
        class="event-cover__image"
        :src="event.banner!"
        alt=""
        loading="lazy"
        @error="bannerFailed = true"
      />
      <!-- No photo to show, so the tone gradient carries the banner on its
           own instead of sitting empty. -->
      <template v-else>
        <span class="event-cover__shape event-cover__shape--top" />
        <span class="event-cover__shape event-cover__shape--bottom" />
      </template>
      <!-- Grounds the badge below, whether it sits over a photo of any
           brightness or over the tone gradient. -->
      <div class="event-cover__scrim" />
    </div>

    <!-- One badge overlapping the banner/content boundary, like a profile
         picture over a cover photo, with or without a banner photo. -->
    <div
      class="event-cover__badge"
      :class="{ 'event-cover__badge--plain': !hasLogo }"
    >
      <img
        v-if="hasLogo"
        class="event-cover__logo"
        :src="event.logo!"
        alt=""
        loading="lazy"
        @error="logoFailed = true"
      />
      <span
        v-else
        class="event-cover__monogram"
      >
        {{ monogram }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { Event } from '@camp-registration/common/entities';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { eventTone } from '@/utils/eventTone';

const {
  event,
  ratio = 2.4,
  badgeAlign = 'start',
} = defineProps<{
  event: Pick<Event, 'id' | 'name' | 'logo' | 'banner'>;
  // Width to height of the banner.
  ratio?: number;
  badgeAlign?: 'start' | 'center';
}>();

const { to } = useObjectTranslation();

const tone = computed(() => eventTone(event.id));

// The URLs point at slots, not file ids: the file behind one can be gone
// (deleted, or turned private) while the page is open. Falling back to the
// gradient or the monogram beats a broken-image icon.
const logoFailed = ref(false);
const bannerFailed = ref(false);

watch(
  () => event.logo,
  () => {
    logoFailed.value = false;
  },
);

watch(
  () => event.banner,
  () => {
    bannerFailed.value = false;
  },
);

const hasLogo = computed<boolean>(() => !!event.logo && !logoFailed.value);
const hasBanner = computed<boolean>(
  () => !!event.banner && !bannerFailed.value,
);

const monogram = computed<string>(
  () => to(event.name).trim().charAt(0).toUpperCase() || '•',
);
</script>

<style scoped>
.event-cover {
  position: relative;
  flex-shrink: 0;
  width: 100%;
}

.event-cover__media {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.event-cover--primary {
  color: var(--md3-on-primary-container);
}

.event-cover--secondary {
  color: var(--md3-on-secondary-container);
}

.event-cover--tertiary {
  color: var(--md3-on-tertiary-container);
}

/* A diagonal two-tone gradient per tone, rather than a flat fill, so the
   placeholder reads as an intentional background instead of an empty one. */
.event-cover--primary .event-cover__media {
  background: linear-gradient(
    135deg,
    var(--md3-primary-container),
    color-mix(
      in srgb,
      var(--md3-primary-container) 55%,
      var(--md3-tertiary-container)
    )
  );
}

.event-cover--secondary .event-cover__media {
  background: linear-gradient(
    135deg,
    var(--md3-secondary-container),
    color-mix(
      in srgb,
      var(--md3-secondary-container) 55%,
      var(--md3-primary-container)
    )
  );
}

.event-cover--tertiary .event-cover__media {
  background: linear-gradient(
    135deg,
    var(--md3-tertiary-container),
    color-mix(
      in srgb,
      var(--md3-tertiary-container) 55%,
      var(--md3-secondary-container)
    )
  );
}

.event-cover__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1);
}

/* Grounds the badge against a photo of any brightness. */
.event-cover__scrim {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 60%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent);
  pointer-events: none;
}

/* Decorative — echoes the tone color at low opacity, framing the badge from
   the opposite corner rather than colliding with it. */
.event-cover__shape {
  position: absolute;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.12;
}

.event-cover__shape--top {
  top: -38%;
  right: -8%;
  width: 60%;
  aspect-ratio: 1;
}

.event-cover__shape--bottom {
  right: 14%;
  bottom: -42%;
  width: 40%;
  aspect-ratio: 1;
}

.event-cover__badge {
  position: absolute;
  bottom: -20px;
  z-index: 1;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 25%;
  aspect-ratio: 1;
  min-width: 60px;
  max-width: 88px;
  overflow: hidden;
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-corner-large, 16px);

  background: var(--md3-surface-container-highest);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);

  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
}

/* Aligned with the content below: a card's heading, or a centered title. */
.event-cover--badge-start .event-cover__badge {
  left: 16px;
}

.event-cover--badge-center .event-cover__badge {
  left: 50%;
  translate: -50% 0;
}

.event-cover__logo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Without a logo, the badge carries the monogram on the tone color instead of
   the neutral logo plate. */
.event-cover__badge--plain {
  padding: 6px;
  border-color: transparent;
}

.event-cover--primary .event-cover__badge--plain {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.event-cover--secondary .event-cover__badge--plain {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.event-cover--tertiary .event-cover__badge--plain {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.event-cover__monogram {
  font-size: clamp(22px, 7vw, 32px);
  font-weight: 700;
  line-height: 1;
  user-select: none;
}
</style>
