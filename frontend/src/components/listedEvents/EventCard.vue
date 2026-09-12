<template>
  <q-card
    v-ripple
    class="event-card cursor-pointer"
    :class="`event-card--${tone}`"
    data-test="event-card"
    tabindex="0"
    role="link"
    :aria-label="to(props.event.name)"
    @click="navigateToRegistration"
    @keyup.enter="navigateToRegistration"
  >
    <span class="q-focus-helper" />
    <div
      class="event-card__banner"
      aria-hidden="true"
    >
      <div class="event-card__banner-media">
        <img
          v-if="hasBanner"
          class="event-card__banner-image"
          :src="props.event.banner!"
          alt=""
          loading="lazy"
          @error="bannerFailed = true"
        />
        <!-- No photo to show, so the tone gradient carries the banner on its
             own instead of sitting empty. -->
        <template v-else>
          <span
            class="event-card__banner-shape event-card__banner-shape--top"
          />
          <span
            class="event-card__banner-shape event-card__banner-shape--bottom"
          />
        </template>
        <!-- Grounds the badge below, whether it sits over a photo of any
             brightness or over the tone gradient — either would otherwise
             leave a same-tone badge with too little contrast to read. -->
        <div class="event-card__banner-scrim" />
      </div>

      <!-- Deliberately outside the clipped media layer above, and rendered
           the same way with or without a banner photo: one badge overlapping
           the banner/content boundary, like a profile picture over a cover
           photo, rather than a giant bare monogram in one case and a small
           flush avatar in the other. -->
      <div
        class="event-card__badge"
        :class="{ 'event-card__badge--plain': !hasLogo }"
      >
        <img
          v-if="hasLogo"
          class="event-card__badge-logo"
          :src="props.event.logo!"
          alt=""
          loading="lazy"
          @error="logoFailed = true"
        />
        <span
          v-else
          class="event-card__badge-monogram"
        >
          {{ monogram }}
        </span>
      </div>
    </div>

    <q-card-section class="event-card__body">
      <div class="event-card__heading">
        <div class="event-card__dates">
          {{ dateRange }}
        </div>
        <div class="event-card__title">
          {{ to(props.event.name) }}
        </div>
        <div class="event-card__organizer ellipsis">
          {{ organizerLabel }}
        </div>
        <div
          v-if="owningOrganization"
          class="event-card__owner ellipsis"
        >
          {{ t('via', { organization: owningOrganization }) }}
        </div>
      </div>

      <div class="event-card__meta">
        <div
          v-if="closesSoon"
          class="event-card__meta-row event-card__meta-row--warning"
        >
          <q-icon
            name="schedule"
            size="18px"
          />
          <span>{{ t('until', { date: closesAtLabel }) }}</span>
        </div>
        <div
          v-if="props.event.location"
          class="event-card__meta-row"
        >
          <q-icon
            name="place"
            size="18px"
          />
          <span class="ellipsis">{{ to(props.event.location) }}</span>
        </div>
        <div class="event-card__meta-row">
          <q-icon
            name="cake"
            size="18px"
          />
          <span>
            {{
              t('age_range', {
                min: props.event.minAge,
                max: props.event.maxAge,
              })
            }}
          </span>
        </div>
      </div>

      <!-- Availability — same layout for national and international events -->
      <div
        v-if="availability"
        class="event-card__capacity"
      >
        <div class="event-card__capacity-label">
          {{ t('places_left_label') }}
        </div>
        <div
          v-for="entry in availability"
          :key="entry.countries.join('-')"
          class="event-card__capacity-row"
          :class="{
            'event-card__capacity-row--low': isLow(entry),
            'event-card__capacity-row--full': entry.free === 0,
          }"
          :title="
            entry.free === 0
              ? t('waitlist')
              : t('places_left', { count: entry.free }, entry.free)
          "
        >
          <template v-if="availability.length > 1">
            <country-icon
              v-for="country in entry.countries"
              :key="country"
              :country
            />
          </template>

          <div
            v-if="entry.max !== null"
            class="event-card__capacity-track"
          >
            <div
              class="event-card__capacity-fill"
              :style="{ width: `${occupancyPercent(entry)}%` }"
            />
          </div>

          <span class="event-card__capacity-count">
            <template v-if="entry.free === 0">
              {{ t('waitlist') }}
            </template>
            <template v-else-if="entry.max !== null">
              {{ entry.free }}
              <span class="event-card__capacity-max"> /{{ entry.max }} </span>
            </template>
            <template v-else>
              {{ t('places_left', { count: entry.free }, entry.free) }}
            </template>
          </span>
        </div>
      </div>

      <div class="event-card__footer">
        <span class="event-card__price">{{ priceLabel }}</span>
        <div class="event-card__flags">
          <country-icon
            v-for="country in props.event.countries"
            :key="country"
            :country
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { Event } from '@camp-registration/common/entities';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';

const { to } = useObjectTranslation();
const { t, locale } = useI18n();
const router = useRouter();

interface Props {
  event: Event;
}

const props = defineProps<Props>();

const tones = ['primary', 'secondary', 'tertiary'] as const;

const tone = computed<(typeof tones)[number]>(() => {
  const hash = [...props.event.id].reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );

  return tones[hash % tones.length] ?? 'primary';
});

// The URL points at a slot, not at a file id: the file behind it can be gone
// (deleted, or turned private) while this list is still on screen. Falling back
// to the monogram beats a broken-image icon.
const logoFailed = ref(false);

watch(
  () => props.event.logo,
  () => {
    logoFailed.value = false;
  },
);

const hasLogo = computed<boolean>(
  () => !!props.event.logo && !logoFailed.value,
);

// Same reasoning as the logo: a banner can vanish while the list is on
// screen, so a broken image quietly falls back to no banner at all.
const bannerFailed = ref(false);

watch(
  () => props.event.banner,
  () => {
    bannerFailed.value = false;
  },
);

const hasBanner = computed<boolean>(
  () => !!props.event.banner && !bannerFailed.value,
);

const monogram = computed<string>(() => {
  return to(props.event.name).trim().charAt(0).toUpperCase() || '•';
});

const organizerLabel = computed<string>(() => to(props.event.organizer));

/** Collapsed for comparison only — never for display. */
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * The owning organization is the vetted name; the organizer is event-authored
 * free text. Naming both is only informative when they actually differ, so the
 * line is suppressed when it would just repeat the organizer already on screen.
 */
const owningOrganization = computed<string | null>(() => {
  const organization = props.event.organizationName;

  return normalize(organization) === normalize(organizerLabel.value)
    ? null
    : organization;
});

interface AvailabilityEntry {
  countries: string[];
  free: number;
  max: number | null;
}

const availability = computed<AvailabilityEntry[] | null>(() => {
  const free = props.event.freePlaces;
  if (free == null) {
    return null;
  }
  const max = props.event.maxParticipants;

  // Single total — one row carrying all event flags
  if (typeof free === 'number') {
    const maxTotal =
      typeof max === 'number'
        ? max
        : Object.values(max ?? {}).reduce<number>(
            (sum, v) => sum + (v ?? 0),
            0,
          );

    return [
      {
        countries: props.event.countries,
        free,
        max: maxTotal > 0 ? maxTotal : null,
      },
    ];
  }

  // Per-country record — one row per country
  const entries = props.event.countries.flatMap<AvailabilityEntry>(
    (country) => {
      const countryFree = free[country];
      if (countryFree === undefined) {
        return [];
      }
      const countryMax =
        typeof max === 'number' ? null : (max?.[country] ?? null);

      return [
        {
          countries: [country],
          free: countryFree,
          max: countryMax != null && countryMax > 0 ? countryMax : null,
        },
      ];
    },
  );

  return entries.length > 0 ? entries : null;
});

function occupancyPercent(entry: AvailabilityEntry): number {
  if (entry.max === null || entry.max === 0) {
    return 0;
  }
  const percent = ((entry.max - entry.free) / entry.max) * 100;

  return Math.min(100, Math.max(0, percent));
}

function isLow(entry: AvailabilityEntry): boolean {
  return entry.free > 0 && entry.free <= 5;
}

const dateRange = computed<string>(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  try {
    return formatter.formatRange(
      new Date(props.event.startAt),
      new Date(props.event.endAt),
    );
  } catch {
    return `${new Date(props.event.startAt).toLocaleDateString()} – ${new Date(
      props.event.endAt,
    ).toLocaleDateString()}`;
  }
});

const priceLabel = computed<string>(() => {
  if (props.event.price === 0) {
    return t('free');
  }

  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(props.event.price) ? 0 : 2,
  }).format(props.event.price);
});

const closesSoonThresholdMs = 14 * 24 * 60 * 60 * 1000;

const closesSoon = computed<boolean>(() => {
  if (!props.event.registrationClosesAt) {
    return false;
  }
  const remaining =
    new Date(props.event.registrationClosesAt).getTime() - Date.now();

  return remaining > 0 && remaining <= closesSoonThresholdMs;
});

const closesAtLabel = computed<string>(() => {
  if (!props.event.registrationClosesAt) {
    return '';
  }

  return new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(props.event.registrationClosesAt));
});

function navigateToRegistration() {
  void router.push({
    name: 'event',
    params: {
      eventId: props.event.id,
    },
  });
}
</script>

<style scoped>
.event-card {
  display: flex;
  flex-direction: column;

  min-width: 0;
  border-radius: var(--md3-corner-extra-large, 28px);
  overflow: hidden;

  background: var(--md3-surface-container);
  box-shadow: none;

  transition:
    border-radius 0.35s var(--md3-easing-emphasized, cubic-bezier(0.2, 0, 0, 1)),
    background-color 0.35s
      var(--md3-easing-emphasized, cubic-bezier(0.2, 0, 0, 1)),
    transform 0.35s var(--md3-easing-emphasized, cubic-bezier(0.2, 0, 0, 1));
}

.event-card:hover {
  border-radius: var(--md3-corner-extra-large, 28px) 48px
    var(--md3-corner-extra-large, 28px) 48px;

  transform: translateY(-2px);
}

.event-card:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

/* Banner — always reserves the same height so every card in a row lines up
   evenly; falls back to a tone gradient when no banner is set, rather than
   leaving stretched neighbors with a blank gap. Not itself clipped: the
   badge overlaps its bottom edge, so only the inner media layer (the banner
   photo, tone gradient, or scrim) is. */
.event-card__banner {
  position: relative;
  flex-shrink: 0;

  width: 100%;
  aspect-ratio: 2.4;
}

.event-card__banner-media {
  position: absolute;
  inset: 0;

  overflow: hidden;
}

.event-card--primary .event-card__banner {
  color: var(--md3-on-primary-container);
}

.event-card--secondary .event-card__banner {
  color: var(--md3-on-secondary-container);
}

.event-card--tertiary .event-card__banner {
  color: var(--md3-on-tertiary-container);
}

/* A diagonal two-tone gradient per tone, rather than a flat fill, so the
   placeholder banner reads as an intentional background instead of an empty
   one. */
.event-card--primary .event-card__banner-media {
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

.event-card--secondary .event-card__banner-media {
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

.event-card--tertiary .event-card__banner-media {
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

.event-card__banner-image {
  display: block;

  width: 100%;
  height: 100%;

  object-fit: cover;

  transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1);
}

.event-card:hover .event-card__banner-image {
  transform: scale(1.05);
}

/* Grounds the badge against a photo of any brightness — without this a
   plain surface plate can float inconsistently over busy or light banners. */
.event-card__banner-scrim {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 60%;

  background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent);
  pointer-events: none;
}

/* Decorative — echoes the tone color at low opacity, placed to frame the
   badge in the opposite corner rather than collide with it. */
.event-card__banner-shape {
  position: absolute;

  border-radius: 50%;
  background: currentColor;
  opacity: 0.12;
}

.event-card__banner-shape--top {
  top: -38%;
  right: -8%;

  width: 60%;
  aspect-ratio: 1;
}

.event-card__banner-shape--bottom {
  right: 14%;
  bottom: -42%;

  width: 40%;
  aspect-ratio: 1;
}

/* Badge — one visual treatment for the logo/monogram whether or not there is
   a banner photo underneath: it always overlaps the banner/content boundary,
   the same way a profile picture sits over a cover photo. */
.event-card__badge {
  position: absolute;
  /* Left-aligned with the heading below (`.event-card__body`'s own 16px
     padding), overlapping the banner's bottom edge rather than sitting
     fully inside it or fully below it. */
  left: 16px;
  bottom: -20px;
  z-index: 1;

  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  width: 25%;
  aspect-ratio: 1;
  min-width: 60px;
  max-width: 88px;
  /* Fixed, not a percentage: percentage padding resolves against the
     *containing block's* width (the badge's, not the plate's own ~60-88px),
     so a percentage here would consume the entire badge before its content. */
  padding: 6px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-corner-large, 16px);

  background: var(--md3-surface-container-highest);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);

  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.event-card:hover .event-card__badge {
  transform: scale(1.06);
}

.event-card__badge-logo {
  display: block;

  width: 100%;
  height: 100%;

  object-fit: contain;
}

/*
 * Without a logo, the badge carries the monogram on the card's tone color
 * instead of the neutral logo plate — colorful, and consistent whether or
 * not there's a banner behind it.
 */
.event-card__badge--plain {
  border-color: transparent;
}

.event-card--primary .event-card__badge--plain {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.event-card--secondary .event-card__badge--plain {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.event-card--tertiary .event-card__badge--plain {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.event-card__badge-monogram {
  font-size: clamp(22px, 7vw, 32px);
  font-weight: 700;
  line-height: 1;

  user-select: none;
}

/* Content */
.event-card__body {
  display: flex;
  flex-direction: column;
  flex: 1;

  padding: 16px;
}

.event-card__heading {
  min-width: 0;

  /* Clears the badge overlapping down from the banner above */
  padding-top: 16px;
}

.event-card__dates {
  color: var(--md3-on-surface-variant);

  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}

.event-card--primary .event-card__dates {
  color: var(--md3-primary);
}

.event-card--secondary .event-card__dates {
  color: var(--md3-secondary);
}

.event-card--tertiary .event-card__dates {
  color: var(--md3-tertiary);
}

.event-card__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;

  margin-top: 2px;

  color: var(--md3-on-surface);

  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.event-card__organizer {
  margin-top: 2px;

  color: var(--md3-on-surface-variant);

  font-size: 13px;
}

.event-card__owner {
  margin-top: 2px;

  color: var(--md3-on-surface-variant);
  opacity: 0.75;

  font-size: 12px;
}

.event-card__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;

  margin-top: 14px;
}

.event-card__meta-row {
  display: flex;
  align-items: center;
  gap: 8px;

  min-width: 0;

  color: var(--md3-on-surface-variant);

  font-size: 13px;
}

.event-card__meta-row--warning {
  color: var(--md3-warning);
  font-weight: 600;
}

.event-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;

  /* `auto` keeps the footer pinned to the bottom on equal-height grid rows */
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--md3-outline-variant);
}

.event-card__price {
  color: var(--md3-on-surface);

  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}

.event-card__flags {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Availability */
.event-card__capacity {
  display: flex;
  flex-direction: column;
  gap: 6px;

  /* `auto` keeps the section pinned above the footer on equal-height rows */
  margin-top: auto;
  padding-top: 14px;
}

.event-card__capacity ~ .event-card__footer {
  margin-top: 12px;
}

.event-card__capacity-label {
  color: var(--md3-on-surface-variant);

  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.event-card__capacity-row {
  display: flex;
  align-items: center;
  gap: 8px;

  min-width: 0;
}

.event-card__capacity-track {
  flex: 1;

  height: 6px;
  border-radius: 3px;
  overflow: hidden;

  background: var(--md3-surface-container-highest);
}

.event-card__capacity-fill {
  height: 100%;
  border-radius: 3px;

  background: var(--md3-primary);

  transition: width 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.event-card__capacity-row--low .event-card__capacity-fill,
.event-card__capacity-row--full .event-card__capacity-fill {
  background: var(--md3-warning);
}

.event-card__capacity-count {
  flex-shrink: 0;

  color: var(--md3-on-surface);

  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.event-card__capacity-max {
  color: var(--md3-on-surface-variant);

  font-weight: 500;
}

.event-card__capacity-row--low .event-card__capacity-count,
.event-card__capacity-row--full .event-card__capacity-count {
  color: var(--md3-warning);
}

@media (prefers-reduced-motion: reduce) {
  .event-card,
  .event-card__badge,
  .event-card__banner-image,
  .event-card__capacity-fill {
    transition: none;
  }

  .event-card:hover {
    transform: none;
  }

  .event-card:hover .event-card__badge,
  .event-card:hover .event-card__banner-image {
    transform: none;
  }
}
</style>

<i18n lang="yaml" locale="en">
age_range: '{min}–{max} years'
free: 'Free'
via: 'via {organization}'
until: 'Until {date}'
waitlist: 'Waitlist'
places_left: 'No places left | 1 place left | {count} places left'
places_left_label: 'Places left'
</i18n>
<i18n lang="yaml" locale="de">
age_range: '{min}–{max} Jahre'
free: 'Kostenlos'
via: 'über {organization}'
until: 'Bis {date}'
waitlist: 'Warteliste'
places_left: 'Keine Plätze frei | Noch 1 Platz frei | Noch {count} Plätze frei'
places_left_label: 'Freie Plätze'
</i18n>
<i18n lang="yaml" locale="fr">
age_range: '{min}–{max} ans'
free: 'Gratuit'
via: 'via {organization}'
until: "Jusqu'au {date}"
waitlist: "Liste d'attente"
places_left: 'Aucune place restante | 1 place restante | {count} places restantes'
places_left_label: 'Places restantes'
</i18n>
<i18n lang="yaml" locale="pl">
age_range: '{min}–{max} lat'
free: 'Bezpłatnie'
via: 'przez {organization}'
until: 'Do {date}'
waitlist: 'Lista rezerwowa'
# Count-invariant phrasing — no Polish plural rules are configured
places_left: 'Wolne miejsca: {count}'
places_left_label: 'Wolne miejsca'
</i18n>
<i18n lang="yaml" locale="cs">
age_range: '{min}–{max} let'
free: 'Zdarma'
via: 'prostřednictvím {organization}'
until: 'Do {date}'
waitlist: 'Čekací listina'
# Count-invariant phrasing — no Czech plural rules are configured
places_left: 'Volná místa: {count}'
places_left_label: 'Volná místa'
</i18n>
