<template>
  <page-state-handler
    :error="fatalError"
    class="events"
  >
    <!--
      HERO — deliberately one row deep. This is a directory, not a landing
      page: the results have to be the first thing on screen, so the title and
      the search box sit side by side instead of stacking.
    -->
    <section class="events__section events-hero">
      <div
        class="events-hero__glow"
        aria-hidden="true"
      />

      <div class="events-hero__intro anim anim--1">
        <h1 class="events-hero__title">
          {{ t('title') }}
          <span class="events-hero__highlight">{{ t('title_highlight') }}</span>
        </h1>
        <p class="events-hero__subtitle">{{ t('subtitle') }}</p>
      </div>

      <div class="events-hero__search anim anim--2">
        <q-icon
          name="search"
          size="20px"
          class="events-hero__search-icon"
        />
        <q-input
          v-model="search"
          class="col"
          :placeholder="t('search')"
          :aria-label="t('search')"
          data-test="events-search"
          debounce="300"
          borderless
          dense
          clearable
        />
      </div>
    </section>

    <!-- =================================================== RESULTS -->
    <section class="events__section events-results">
      <event-filter-bar
        v-model:search="search"
        v-model:countries="countries"
        v-model:age="age"
        v-model:start-at="startAt"
        v-model:end-at="endAt"
        v-model:sort="sort"
        @clear="clearFilters"
      >
        <!-- Result count. `role=status` so the change is announced, not just seen. -->
        <template #status>
          <span
            role="status"
            aria-live="polite"
            data-test="events-count"
          >
            {{
              initialLoading
                ? t('loading')
                : t('count', { count: total }, total)
            }}
          </span>
        </template>
      </event-filter-bar>

      <!-- Loading -->
      <div
        v-if="initialLoading"
        class="events__skeletons"
      >
        <event-card-skeleton
          v-for="n in 6"
          :key="n"
        />
      </div>

      <!-- Nothing matches the current filters -->
      <div
        v-else-if="events.length === 0 && activeFilterCount > 0"
        class="events-empty"
        data-test="events-no-results"
      >
        <div class="events-empty__icon">
          <q-icon
            name="search_off"
            size="30px"
          />
        </div>
        <h2 class="events-empty__title">{{ t('no_results.title') }}</h2>
        <p class="events-empty__text">{{ t('no_results.message') }}</p>
        <m-btn
          tonal
          no-caps
          icon="filter_alt_off"
          :label="t('no_results.action')"
          @click="clearFilters"
        />
      </div>

      <!-- Nothing open at all -->
      <div
        v-else-if="events.length === 0"
        class="events-empty"
        data-test="events-empty"
      >
        <div class="events-empty__icon events-empty__icon--tertiary">
          <q-icon
            name="travel_explore"
            size="30px"
          />
        </div>
        <h2 class="events-empty__title">{{ t('empty.title') }}</h2>
        <p class="events-empty__text">{{ t('empty.message') }}</p>
      </div>

      <!-- Events -->
      <event-grid
        v-else
        ref="grid"
        :events
        :loading
        :has-more="hasMore"
        @load-more="loadMore"
      >
        <template #after>
          <div class="events__footer">
            <div
              v-if="loadingMore"
              class="events__skeletons"
            >
              <event-card-skeleton
                v-for="n in 3"
                :key="n"
              />
            </div>

            <div
              v-else-if="error"
              class="column items-center q-gutter-y-sm"
            >
              <p class="events__footer-text">{{ t('load_error') }}</p>
              <m-btn
                text
                no-caps
                icon="refresh"
                :label="t('retry')"
                @click="loadMore"
              />
            </div>

            <p
              v-else-if="!hasMore"
              class="events__footer-text"
            >
              {{ t('end_of_list') }}
            </p>
          </div>
        </template>
      </event-grid>
    </section>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import EventCardSkeleton from '@/components/events/EventCardSkeleton.vue';
import EventFilterBar from '@/components/events/EventFilterBar.vue';
import EventGrid from '@/components/events/EventGrid.vue';
import { useAPIService } from '@/services/APIService';
import { useServerList } from '@/composables/serverList';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';
import {
  EVENT_COUNTRIES,
  EVENT_SORT_OPTIONS,
  DEFAULT_EVENT_SORT,
  sortOptionOf,
  sortOrderOf,
  type EventSortOption,
} from '@/components/events/filters';
import type { Event, EventQuery } from '@camp-registration/common/entities';

const { t } = useI18n();
const api = useAPIService();
const {
  getStringQueryParam,
  getNumericQueryParam,
  getEnumQueryParam,
  setQueryParams,
} = useRouteQueryParams();

const grid = useTemplateRef<InstanceType<typeof EventGrid>>('grid');

// Seeded once from the URL. Arriving at a filtered link remounts this page, so
// there is no need to watch the query back into the refs — which would loop
// against the writer below.
const countries = ref<string[] | undefined>(
  parseCountries(getStringQueryParam('country')),
);
const age = ref<number | undefined>(getNumericQueryParam('age') ?? undefined);
const startAt = ref<string | undefined>(
  getStringQueryParam('from') ?? undefined,
);
const endAt = ref<string | undefined>(getStringQueryParam('to') ?? undefined);

const initialSort =
  getEnumQueryParam('sort', EVENT_SORT_OPTIONS) ?? DEFAULT_EVENT_SORT;

const {
  rows: events,
  search,
  sortBy,
  descending,
  loading,
  initialLoading,
  loadingMore,
  error,
  total,
  hasMore,
  loadMore,
} = useServerList<Event, EventQuery>({
  storeName: 'event',
  // Divisible by every column count the grid can produce, so a chunk boundary
  // never leaves a stray single card in the last row.
  pageSize: 24,
  sortBy: sortOrderOf(initialSort).sortBy,
  descending: sortOrderOf(initialSort).descending,
  watchSources: [countries, age, startAt, endAt],
  onReset: () => grid.value?.reset(),
  fetch: (query) => api.fetchEventsPaginated(query),
  // Cast as in the administration tables: every field is genuinely optional,
  // but `exactOptionalPropertyTypes` rejects an explicit `undefined`.
  buildQuery: ({ cursor, limit, sortBy, sortType, search }) =>
    ({
      // The public directory is open, listed events only — pinned, not a filter.
      status: 'open',
      listed: true,
      cursor,
      limit,
      sortBy,
      sortType,
      name: search || undefined,
      country: countries.value?.length ? countries.value.join(',') : undefined,
      age: age.value,
      startAt: startAt.value,
      endAt: endAt.value,
    }) as EventQuery,
});

search.value = getStringQueryParam('q') ?? '';

const sort = computed<EventSortOption>({
  get: () => sortOptionOf(sortBy.value, descending.value),
  set: (option) => {
    const order = sortOrderOf(option);
    sortBy.value = order.sortBy;
    descending.value = order.descending;
  },
});

const activeFilterCount = computed<number>(
  () =>
    [search.value, age.value, startAt.value, endAt.value].filter(
      (value) => value !== undefined && value !== null && value !== '',
    ).length + (countries.value?.length ?? 0),
);

// Keep the view shareable. The default sort is left out so an unfiltered visit
// keeps a bare /events.
watch(
  [search, countries, age, startAt, endAt, sort],
  () => {
    setQueryParams({
      q: search.value || null,
      country: countries.value?.length ? countries.value.join(',') : null,
      age: age.value ?? null,
      from: startAt.value ?? null,
      to: endAt.value ?? null,
      sort: sort.value === DEFAULT_EVENT_SORT ? null : sort.value,
    });
  },
  { flush: 'post' },
);

function clearFilters(): void {
  search.value = '';
  countries.value = undefined;
  age.value = undefined;
  startAt.value = undefined;
  endAt.value = undefined;
}

// A failure with cards already on screen belongs under the grid, not in place
// of the whole page.
const fatalError = computed<string | null>(() =>
  events.value.length === 0 ? error.value : null,
);

/** `?country=de,fr` — a comma keeps a shared link short and readable. */
function parseCountries(value: string | null): string[] | undefined {
  const codes = (value ?? '')
    .split(',')
    .map((code) => code.trim().toLowerCase())
    .filter((code) => EVENT_COUNTRIES.includes(code));

  return codes.length > 0 ? codes : undefined;
}
</script>

<style scoped>
/*
 * Same shell as the landing page — a centred 1080px column on the plain page
 * background, not a Quasar grid row — so a visitor arriving from "Browse open
 * events" stays inside one continuous design.
 */
.events {
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 0 24px 48px;
  overflow-x: clip;

  /* The theme ships shape and motion as Sass variables only, so mirror the
   * ones used here as custom properties. Values from its variables.scss. */
  --md3-corner-large: 16px;
  --md3-corner-extra-large: 28px;
  --md3-corner-full: 9999px;
  --md3-easing-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --md3-easing-emphasized-decel: cubic-bezier(0.05, 0.7, 0.1, 1);
}

.events__section {
  width: 100%;
  max-width: 1080px;
}

/* ========================================================== HERO */
.events-hero {
  position: relative;

  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px 40px;

  padding: 4px 0 0;
}

.events-hero__glow {
  position: absolute;
  inset: -140px -20% auto;
  z-index: -1;

  height: 420px;
  pointer-events: none;

  background:
    radial-gradient(
      42% 55% at 18% 40%,
      rgba(var(--md3-primary-rgb), 0.13),
      transparent 70%
    ),
    radial-gradient(
      36% 50% at 85% 30%,
      rgba(var(--md3-primary-rgb), 0.07),
      transparent 70%
    );
}

.events-hero__intro {
  flex: 1 1 320px;

  min-width: 0;
}

.events-hero__title {
  margin: 0;

  color: var(--md3-on-surface);

  font-size: clamp(1.75rem, 3.4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.1;
}

.events-hero__highlight {
  display: inline-block;

  padding: 0.04em 0.35em 0.1em;
  border-radius: 0.32em 0.9em 0.32em 0.9em;

  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);

  transform: rotate(-1.2deg);
}

.events-hero__subtitle {
  max-width: 46ch;
  margin: 6px 0 0;

  color: var(--md3-on-surface-variant);

  font-size: 0.95rem;
  line-height: 1.5;
}

.events-hero__search {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 1 400px;

  height: 52px;
  padding: 0 8px 0 18px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: var(--md3-corner-full);

  background: var(--md3-surface-container-lowest);

  transition:
    border-color 0.2s var(--md3-easing-emphasized),
    box-shadow 0.2s var(--md3-easing-emphasized);
}

.events-hero__search:focus-within {
  border-color: var(--md3-primary);
  box-shadow: 0 0 0 3px rgba(var(--md3-primary-rgb), 0.16);
}

.events-hero__search-icon {
  color: var(--md3-on-surface-variant);
}

.events-hero__search :deep(.q-field__control),
.events-hero__search :deep(input) {
  height: 50px;
  font-size: 1rem;
}

/* ======================================================= RESULTS */
.events-results {
  display: flex;
  flex-direction: column;
  gap: 12px;

  padding-top: 12px;
}

.events__skeletons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 16px;
  align-items: stretch;
}

.events__footer {
  padding: 16px 0 32px;
}

.events__footer-text {
  margin: 0;

  color: var(--md3-on-surface-variant);

  font-size: 0.9rem;
  text-align: center;
}

/* Expressive asymmetric corner, as on the landing page's split cards */
.events-empty {
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: clamp(40px, 6vw, 72px) clamp(24px, 5vw, 56px);
  border-radius: var(--md3-corner-extra-large) var(--md3-corner-extra-large)
    var(--md3-corner-extra-large) 72px;

  background: var(--md3-surface-container-low);
  text-align: center;
}

.events-empty__icon {
  display: inline-flex;

  padding: 14px;
  border-radius: var(--md3-corner-large);

  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.events-empty__icon--tertiary {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.events-empty__title {
  margin: 20px 0 0;

  color: var(--md3-on-surface);

  font-size: clamp(1.25rem, 2.4vw, 1.6rem);
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.events-empty__text {
  max-width: 48ch;
  margin: 10px 0 20px;

  color: var(--md3-on-surface-variant);

  font-size: 1rem;
  line-height: 1.55;
}

/* ===================================================== ENTRANCE */
@media (prefers-reduced-motion: no-preference) {
  .anim {
    animation: events-rise 0.7s var(--md3-easing-emphasized-decel) both;
  }

  .anim--1 {
    animation-delay: 0.05s;
  }

  .anim--2 {
    animation-delay: 0.15s;
  }
}

@keyframes events-rise {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =================================================== RESPONSIVE */
@media (max-width: 700px) {
  .events {
    padding: 0 16px 40px;
  }

  .events-hero {
    gap: 14px;
  }

  .events-hero__search {
    flex-basis: 100%;
    height: 50px;
  }

  .events-hero__search :deep(.q-field__control),
  .events-hero__search :deep(input) {
    height: 48px;
  }

  .events-empty {
    border-radius: var(--md3-corner-extra-large) var(--md3-corner-extra-large)
      var(--md3-corner-extra-large) 48px;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Find your'
title_highlight: 'next event'
subtitle: 'Every event currently open for registration.'
search: 'Search by name'
loading: 'Loading events…'
count: 'No events | 1 event | {count} events'
empty:
  title: 'No events open right now'
  message: 'Check back soon — new events will appear here as soon as registration opens.'
no_results:
  title: 'No events match your filters'
  message: 'Try a wider date range or another country, or clear the filters to see everything.'
  action: 'Clear filters'
load_error: 'More events could not be loaded.'
retry: 'Try again'
end_of_list: 'That is every event open right now.'
</i18n>
<i18n lang="yaml" locale="de">
title: 'Finde deine'
title_highlight: 'nächste Veranstaltung'
subtitle: 'Alle Veranstaltungen, die gerade zur Anmeldung geöffnet sind.'
search: 'Nach Name suchen'
loading: 'Veranstaltungen werden geladen…'
count: 'Keine Veranstaltungen | 1 Veranstaltung | {count} Veranstaltungen'
empty:
  title: 'Aktuell sind keine Veranstaltungen geöffnet'
  message: 'Schau bald wieder vorbei – neue Veranstaltungen erscheinen hier, sobald die Anmeldung beginnt.'
no_results:
  title: 'Keine Veranstaltungen passen zu deinen Filtern'
  message: 'Probiere einen größeren Zeitraum oder ein anderes Land, oder setze die Filter zurück.'
  action: 'Filter zurücksetzen'
load_error: 'Weitere Veranstaltungen konnten nicht geladen werden.'
retry: 'Erneut versuchen'
end_of_list: 'Das sind alle derzeit geöffneten Veranstaltungen.'
</i18n>
<i18n lang="yaml" locale="fr">
title: 'Trouve ton'
title_highlight: 'prochain événement'
subtitle: 'Tous les événements actuellement ouverts aux inscriptions.'
search: 'Rechercher par nom'
loading: 'Chargement des événements…'
count: 'Aucun événement | 1 événement | {count} événements'
empty:
  title: 'Aucun événement ouvert pour le moment'
  message: "Reviens bientôt – les nouveaux événements apparaîtront ici dès l'ouverture des inscriptions."
no_results:
  title: 'Aucun événement ne correspond à tes filtres'
  message: 'Essaie une période plus large ou un autre pays, ou efface les filtres pour tout voir.'
  action: 'Effacer les filtres'
load_error: "D'autres événements n'ont pas pu être chargés."
retry: 'Réessayer'
end_of_list: 'Ce sont tous les événements actuellement ouverts.'
</i18n>
<i18n lang="yaml" locale="pl">
title: 'Znajdź swój'
title_highlight: 'następny wydarzenie'
subtitle: 'Wszystkie wydarzenia, na które trwają obecnie zapisy.'
search: 'Szukaj po nazwie'
loading: 'Ładowanie wydarzeń…'
# Count-invariant phrasing — no Polish plural rules are configured
count: 'Wydarzenia: {count}'
empty:
  title: 'Obecnie brak otwartych wydarzeń'
  message: 'Zajrzyj wkrótce – nowe wydarzenia pojawią się tutaj, gdy tylko rozpoczną się zapisy.'
no_results:
  title: 'Żadne wydarzenie nie pasuje do filtrów'
  message: 'Spróbuj szerszego zakresu dat lub innego kraju, albo wyczyść filtry, aby zobaczyć wszystko.'
  action: 'Wyczyść filtry'
load_error: 'Nie udało się wczytać kolejnych wydarzeń.'
retry: 'Spróbuj ponownie'
end_of_list: 'To wszystkie obecnie otwarte wydarzenia.'
</i18n>
<i18n lang="yaml" locale="cs">
title: 'Najdi svůj'
title_highlight: 'další akce'
subtitle: 'Všechny akce, které jsou právě otevřené k registraci.'
search: 'Hledat podle názvu'
loading: 'Načítání akcí…'
# Count-invariant phrasing — no Czech plural rules are configured
count: 'Akce: {count}'
empty:
  title: 'Momentálně nejsou otevřené žádné akce'
  message: 'Zastav se brzy znovu – nové akce se zde objeví, jakmile se otevře registrace.'
no_results:
  title: 'Žádná akce neodpovídá filtrům'
  message: 'Zkus širší období nebo jinou zemi, případně zruš filtry a zobraz vše.'
  action: 'Zrušit filtry'
load_error: 'Další akce se nepodařilo načíst.'
retry: 'Zkusit znovu'
end_of_list: 'To jsou všechny právě otevřené akce.'
</i18n>
