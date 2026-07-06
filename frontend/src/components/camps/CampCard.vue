<template>
  <q-card
    v-ripple
    class="camp-card cursor-pointer"
    :class="`camp-card--${tone}`"
    data-test="camp-card"
    tabindex="0"
    role="link"
    :aria-label="to(props.camp.name)"
    @click="navigateToRegistration"
    @keyup.enter="navigateToRegistration"
  >
    <span class="q-focus-helper" />

    <!-- Banner -->
    <!-- TODO Replace monogram banner with the actual camp logo once available -->
    <div class="camp-card__banner">
      <span
        class="camp-card__banner-shape camp-card__banner-shape--top"
        aria-hidden="true"
      />
      <span
        class="camp-card__banner-shape camp-card__banner-shape--bottom"
        aria-hidden="true"
      />
      <span
        class="camp-card__monogram"
        aria-hidden="true"
      >
        {{ monogram }}
      </span>

      <div
        v-if="closesSoon"
        class="camp-card__deadline"
      >
        <q-icon
          name="schedule"
          size="14px"
        />
        {{ t('until', { date: closesAtLabel }) }}
      </div>
    </div>

    <!-- Content -->
    <q-card-section class="camp-card__body">
      <div class="camp-card__dates">
        {{ dateRange }}
      </div>
      <div class="camp-card__title">
        {{ to(props.camp.name) }}
      </div>
      <div class="camp-card__organizer ellipsis">
        {{ to(props.camp.organizer) }}
      </div>

      <div class="camp-card__meta">
        <div
          v-if="props.camp.location"
          class="camp-card__meta-row"
        >
          <q-icon
            name="place"
            size="18px"
          />
          <span class="ellipsis">{{ to(props.camp.location) }}</span>
        </div>
        <div class="camp-card__meta-row">
          <q-icon
            name="cake"
            size="18px"
          />
          <span>
            {{
              t('age_range', { min: props.camp.minAge, max: props.camp.maxAge })
            }}
          </span>
        </div>
      </div>

      <!-- Availability — same layout for national and international camps -->
      <div
        v-if="availability"
        class="camp-card__capacity"
      >
        <div class="camp-card__capacity-label">
          {{ t('places_left_label') }}
        </div>
        <div
          v-for="entry in availability"
          :key="entry.countries.join('-')"
          class="camp-card__capacity-row"
          :class="{
            'camp-card__capacity-row--low': isLow(entry),
            'camp-card__capacity-row--full': entry.free === 0,
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
            class="camp-card__capacity-track"
          >
            <div
              class="camp-card__capacity-fill"
              :style="{ width: `${occupancyPercent(entry)}%` }"
            />
          </div>

          <span class="camp-card__capacity-count">
            <template v-if="entry.free === 0">
              {{ t('waitlist') }}
            </template>
            <template v-else-if="entry.max !== null">
              {{ entry.free }}
              <span class="camp-card__capacity-max"> /{{ entry.max }} </span>
            </template>
            <template v-else>
              {{ t('places_left', { count: entry.free }, entry.free) }}
            </template>
          </span>
        </div>
      </div>

      <div class="camp-card__footer">
        <span class="camp-card__price">{{ priceLabel }}</span>
        <div class="camp-card__flags">
          <country-icon
            v-for="country in props.camp.countries"
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
import type { Camp } from '@camp-registration/common/entities';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';

const { to } = useObjectTranslation();
const { t, locale } = useI18n();
const router = useRouter();

interface Props {
  camp: Camp;
}

const props = defineProps<Props>();

const tones = ['primary', 'secondary', 'tertiary'] as const;

const tone = computed<(typeof tones)[number]>(() => {
  const hash = [...props.camp.id].reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );

  return tones[hash % tones.length] ?? 'primary';
});

const monogram = computed<string>(() => {
  return to(props.camp.name).trim().charAt(0).toUpperCase() || '•';
});

interface AvailabilityEntry {
  countries: string[];
  free: number;
  max: number | null;
}

const availability = computed<AvailabilityEntry[] | null>(() => {
  const free = props.camp.freePlaces;
  if (free == null) {
    return null;
  }
  const max = props.camp.maxParticipants;

  // Single total — one row carrying all camp flags
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
        countries: props.camp.countries,
        free,
        max: maxTotal > 0 ? maxTotal : null,
      },
    ];
  }

  // Per-country record — one row per country
  const entries = props.camp.countries.flatMap<AvailabilityEntry>((country) => {
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
  });

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
      new Date(props.camp.startAt),
      new Date(props.camp.endAt),
    );
  } catch {
    return `${new Date(props.camp.startAt).toLocaleDateString()} – ${new Date(
      props.camp.endAt,
    ).toLocaleDateString()}`;
  }
});

const priceLabel = computed<string>(() => {
  if (props.camp.price === 0) {
    return t('free');
  }

  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(props.camp.price) ? 0 : 2,
  }).format(props.camp.price);
});

const closesSoonThresholdMs = 14 * 24 * 60 * 60 * 1000;

const closesSoon = computed<boolean>(() => {
  if (!props.camp.registrationClosesAt) {
    return false;
  }
  const remaining =
    new Date(props.camp.registrationClosesAt).getTime() - Date.now();

  return remaining > 0 && remaining <= closesSoonThresholdMs;
});

const closesAtLabel = computed<string>(() => {
  if (!props.camp.registrationClosesAt) {
    return '';
  }

  return new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(props.camp.registrationClosesAt));
});

function navigateToRegistration() {
  void router.push({
    name: 'camp',
    params: {
      campId: props.camp.id,
    },
  });
}
</script>

<style scoped>
.camp-card {
  display: flex;
  flex-direction: column;

  min-width: 0;
  border-radius: 16px;
  overflow: hidden;

  background: var(--md3-surface-container-low);
  box-shadow: none;

  transition:
    box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1),
    transform 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.camp-card:hover {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 4px 8px 3px rgba(0, 0, 0, 0.15);

  transform: translateY(-2px);
}

.camp-card:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

/* Banner */
.camp-card__banner {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  height: 120px;
  overflow: hidden;
}

.camp-card--primary .camp-card__banner {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.camp-card--secondary .camp-card__banner {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.camp-card--tertiary .camp-card__banner {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.camp-card__monogram {
  font-size: 56px;
  font-weight: 700;
  line-height: 1;

  opacity: 0.9;
  user-select: none;

  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.camp-card:hover .camp-card__monogram {
  transform: scale(1.1);
}

.camp-card__banner-shape {
  position: absolute;
  border-radius: 50%;

  background: currentColor;
  opacity: 0.08;
}

.camp-card__banner-shape--top {
  top: -64px;
  right: -32px;
  width: 144px;
  height: 144px;
}

.camp-card__banner-shape--bottom {
  bottom: -48px;
  left: -24px;
  width: 96px;
  height: 96px;
}

.camp-card__deadline {
  position: absolute;
  bottom: 8px;
  left: 8px;

  display: inline-flex;
  align-items: center;
  gap: 4px;

  height: 24px;
  padding: 0 10px;
  border-radius: 12px;

  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);

  font-size: 12px;
  font-weight: 600;
}

/* Content */
.camp-card__body {
  display: flex;
  flex-direction: column;
  flex: 1;

  padding: 16px;
}

.camp-card__dates {
  color: var(--md3-on-surface-variant);

  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}

.camp-card--primary .camp-card__dates {
  color: var(--md3-primary);
}

.camp-card--secondary .camp-card__dates {
  color: var(--md3-secondary);
}

.camp-card--tertiary .camp-card__dates {
  color: var(--md3-tertiary);
}

.camp-card__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;

  margin-top: 4px;

  color: var(--md3-on-surface);

  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.camp-card__organizer {
  margin-top: 2px;

  color: var(--md3-on-surface-variant);

  font-size: 13px;
}

.camp-card__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;

  margin-top: 14px;
}

.camp-card__meta-row {
  display: flex;
  align-items: center;
  gap: 8px;

  min-width: 0;

  color: var(--md3-on-surface-variant);

  font-size: 13px;
}

.camp-card__footer {
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

.camp-card__price {
  color: var(--md3-on-surface);

  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.camp-card__flags {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Availability */
.camp-card__capacity {
  display: flex;
  flex-direction: column;
  gap: 6px;

  /* `auto` keeps the section pinned above the footer on equal-height rows */
  margin-top: auto;
  padding-top: 14px;
}

.camp-card__capacity ~ .camp-card__footer {
  margin-top: 12px;
}

.camp-card__capacity-label {
  color: var(--md3-on-surface-variant);

  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.camp-card__capacity-row {
  display: flex;
  align-items: center;
  gap: 8px;

  min-width: 0;
}

.camp-card__capacity-track {
  flex: 1;

  height: 6px;
  border-radius: 3px;
  overflow: hidden;

  background: var(--md3-surface-container-highest);
}

.camp-card__capacity-fill {
  height: 100%;
  border-radius: 3px;

  background: var(--md3-primary);

  transition: width 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.camp-card__capacity-row--low .camp-card__capacity-fill,
.camp-card__capacity-row--full .camp-card__capacity-fill {
  background: var(--md3-warning);
}

.camp-card__capacity-count {
  flex-shrink: 0;

  color: var(--md3-on-surface);

  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.camp-card__capacity-max {
  color: var(--md3-on-surface-variant);

  font-weight: 500;
}

.camp-card__capacity-row--low .camp-card__capacity-count,
.camp-card__capacity-row--full .camp-card__capacity-count {
  color: var(--md3-warning);
}
</style>

<i18n lang="yaml" locale="en">
age_range: '{min}–{max} years'
free: 'Free'
until: 'Until {date}'
waitlist: 'Waitlist'
places_left: 'No places left | 1 place left | {count} places left'
places_left_label: 'Places left'
</i18n>
<i18n lang="yaml" locale="de">
age_range: '{min}–{max} Jahre'
free: 'Kostenlos'
until: 'Bis {date}'
waitlist: 'Warteliste'
places_left: 'Keine Plätze frei | Noch 1 Platz frei | Noch {count} Plätze frei'
places_left_label: 'Freie Plätze'
</i18n>
<i18n lang="yaml" locale="fr">
age_range: '{min}–{max} ans'
free: 'Gratuit'
until: "Jusqu'au {date}"
waitlist: "Liste d'attente"
places_left: 'Aucune place restante | 1 place restante | {count} places restantes'
places_left_label: 'Places restantes'
</i18n>
<i18n lang="yaml" locale="pl">
age_range: '{min}–{max} lat'
free: 'Bezpłatnie'
until: 'Do {date}'
waitlist: 'Lista rezerwowa'
# Count-invariant phrasing — no Polish plural rules are configured
places_left: 'Wolne miejsca: {count}'
places_left_label: 'Wolne miejsca'
</i18n>
<i18n lang="yaml" locale="cs">
age_range: '{min}–{max} let'
free: 'Zdarma'
until: 'Do {date}'
waitlist: 'Čekací listina'
# Count-invariant phrasing — no Czech plural rules are configured
places_left: 'Volná místa: {count}'
places_left_label: 'Volná místa'
</i18n>
