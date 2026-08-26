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

    <!-- Banner -->
    <!-- TODO Replace monogram banner with the actual event logo once available -->
    <div class="event-card__banner">
      <span
        class="event-card__banner-shape event-card__banner-shape--top"
        aria-hidden="true"
      />
      <span
        class="event-card__banner-shape event-card__banner-shape--bottom"
        aria-hidden="true"
      />
      <span
        class="event-card__monogram"
        aria-hidden="true"
      >
        {{ monogram }}
      </span>

      <div
        v-if="closesSoon"
        class="event-card__deadline"
      >
        <q-icon
          name="schedule"
          size="14px"
        />
        {{ t('until', { date: closesAtLabel }) }}
      </div>
    </div>

    <!-- Content -->
    <q-card-section class="event-card__body">
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

      <div class="event-card__meta">
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
import { computed } from 'vue';
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

/* Banner */
.event-card__banner {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  height: 120px;
  overflow: hidden;
}

.event-card--primary .event-card__banner {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.event-card--secondary .event-card__banner {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.event-card--tertiary .event-card__banner {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.event-card__monogram {
  font-size: 56px;
  font-weight: 700;
  line-height: 1;

  opacity: 0.9;
  user-select: none;

  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.event-card:hover .event-card__monogram {
  transform: scale(1.1);
}

.event-card__banner-shape {
  position: absolute;
  border-radius: 50%;

  background: currentColor;
  opacity: 0.08;
}

.event-card__banner-shape--top {
  top: -64px;
  right: -32px;
  width: 144px;
  height: 144px;
}

.event-card__banner-shape--bottom {
  bottom: -48px;
  left: -24px;
  width: 96px;
  height: 96px;
}

.event-card__deadline {
  position: absolute;
  top: 10px;
  right: 10px;

  display: inline-flex;
  align-items: center;
  gap: 4px;

  height: 26px;
  padding: 0 10px;
  border-radius: 13px;

  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);

  font-size: 12px;
  font-weight: 600;
}

/* Content */
.event-card__body {
  display: flex;
  flex-direction: column;
  flex: 1;

  padding: 16px;
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

  margin-top: 4px;

  color: var(--md3-on-surface);

  font-size: 1.15rem;
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
  .event-card__monogram,
  .event-card__capacity-fill {
    transition: none;
  }

  .event-card:hover {
    transform: none;
  }

  .event-card:hover .event-card__monogram {
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
