<template>
  <page-state-handler
    :error="fatalError"
    class="camps"
  >
    <!--
      HERO — deliberately one row deep. This is a directory, not a landing
      page: the results have to be the first thing on screen, so the title and
      the search box sit side by side instead of stacking.
    -->
    <section class="camps__section camps-hero">
      <div
        class="camps-hero__glow"
        aria-hidden="true"
      />

      <div class="camps-hero__intro anim anim--1">
        <h1 class="camps-hero__title">
          {{ t('title') }}
          <span class="camps-hero__highlight">{{ t('title_highlight') }}</span>
        </h1>
        <p class="camps-hero__subtitle">{{ t('subtitle') }}</p>
      </div>

      <div class="camps-hero__search anim anim--2">
        <q-icon
          name="search"
          size="20px"
          class="camps-hero__search-icon"
        />
        <q-input
          v-model="search"
          class="col"
          :placeholder="t('search')"
          :aria-label="t('search')"
          data-test="camps-search"
          debounce="300"
          borderless
          dense
          clearable
        />
      </div>
    </section>

    <!-- =================================================== RESULTS -->
    <section class="camps__section camps-results">
      <camp-filter-bar
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
            data-test="camps-count"
          >
            {{
              initialLoading
                ? t('loading')
                : t('count', { count: total }, total)
            }}
          </span>
        </template>
      </camp-filter-bar>

      <!-- Loading -->
      <div
        v-if="initialLoading"
        class="camps__skeletons"
      >
        <camp-card-skeleton
          v-for="n in 6"
          :key="n"
        />
      </div>

      <!-- Nothing matches the current filters -->
      <div
        v-else-if="camps.length === 0 && activeFilterCount > 0"
        class="camps-empty"
        data-test="camps-no-results"
      >
        <div class="camps-empty__icon">
          <q-icon
            name="search_off"
            size="30px"
          />
        </div>
        <h2 class="camps-empty__title">{{ t('no_results.title') }}</h2>
        <p class="camps-empty__text">{{ t('no_results.message') }}</p>
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
        v-else-if="camps.length === 0"
        class="camps-empty"
        data-test="camps-empty"
      >
        <div class="camps-empty__icon camps-empty__icon--tertiary">
          <q-icon
            name="travel_explore"
            size="30px"
          />
        </div>
        <h2 class="camps-empty__title">{{ t('empty.title') }}</h2>
        <p class="camps-empty__text">{{ t('empty.message') }}</p>
      </div>

      <!-- Camps -->
      <camp-grid
        v-else
        ref="grid"
        :camps
        :loading
        :has-more="hasMore"
        @load-more="loadMore"
      >
        <template #after>
          <div class="camps__footer">
            <div
              v-if="loadingMore"
              class="camps__skeletons"
            >
              <camp-card-skeleton
                v-for="n in 3"
                :key="n"
              />
            </div>

            <div
              v-else-if="error"
              class="column items-center q-gutter-y-sm"
            >
              <p class="camps__footer-text">{{ t('load_error') }}</p>
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
              class="camps__footer-text"
            >
              {{ t('end_of_list') }}
            </p>
          </div>
        </template>
      </camp-grid>
    </section>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import CampCardSkeleton from '@/components/camps/CampCardSkeleton.vue';
import CampFilterBar from '@/components/camps/CampFilterBar.vue';
import CampGrid from '@/components/camps/CampGrid.vue';
import { useAPIService } from '@/services/APIService';
import { useServerList } from '@/composables/serverList';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';
import {
  CAMP_COUNTRIES,
  CAMP_SORT_OPTIONS,
  DEFAULT_CAMP_SORT,
  sortOptionOf,
  sortOrderOf,
  type CampSortOption,
} from '@/components/camps/filters';
import type { Camp, CampQuery } from '@camp-registration/common/entities';

const { t } = useI18n();
const api = useAPIService();
const {
  getStringQueryParam,
  getNumericQueryParam,
  getEnumQueryParam,
  setQueryParams,
} = useRouteQueryParams();

const grid = useTemplateRef<InstanceType<typeof CampGrid>>('grid');

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
  getEnumQueryParam('sort', CAMP_SORT_OPTIONS) ?? DEFAULT_CAMP_SORT;

const {
  rows: camps,
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
} = useServerList<Camp, CampQuery>({
  storeName: 'camp',
  // Divisible by every column count the grid can produce, so a chunk boundary
  // never leaves a stray single card in the last row.
  pageSize: 24,
  sortBy: sortOrderOf(initialSort).sortBy,
  descending: sortOrderOf(initialSort).descending,
  watchSources: [countries, age, startAt, endAt],
  onReset: () => grid.value?.reset(),
  fetch: (query) => api.fetchCampsPaginated(query),
  // Cast as in the administration tables: every field is genuinely optional,
  // but `exactOptionalPropertyTypes` rejects an explicit `undefined`.
  buildQuery: ({ cursor, limit, sortBy, sortType, search }) =>
    ({
      // The public directory is open, listed camps only — pinned, not a filter.
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
    }) as CampQuery,
});

search.value = getStringQueryParam('q') ?? '';

const sort = computed<CampSortOption>({
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
// keeps a bare /camps.
watch(
  [search, countries, age, startAt, endAt, sort],
  () => {
    setQueryParams({
      q: search.value || null,
      country: countries.value?.length ? countries.value.join(',') : null,
      age: age.value ?? null,
      from: startAt.value ?? null,
      to: endAt.value ?? null,
      sort: sort.value === DEFAULT_CAMP_SORT ? null : sort.value,
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
  camps.value.length === 0 ? error.value : null,
);

/** `?country=de,fr` — a comma keeps a shared link short and readable. */
function parseCountries(value: string | null): string[] | undefined {
  const codes = (value ?? '')
    .split(',')
    .map((code) => code.trim().toLowerCase())
    .filter((code) => CAMP_COUNTRIES.includes(code));

  return codes.length > 0 ? codes : undefined;
}
</script>

<style scoped>
/*
 * Same shell as the landing page — a centred 1080px column on the plain page
 * background, not a Quasar grid row — so a visitor arriving from "Browse open
 * camps" stays inside one continuous design.
 */
.camps {
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

.camps__section {
  width: 100%;
  max-width: 1080px;
}

/* ========================================================== HERO */
.camps-hero {
  position: relative;

  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px 40px;

  padding: 4px 0 0;
}

.camps-hero__glow {
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

.camps-hero__intro {
  flex: 1 1 320px;

  min-width: 0;
}

.camps-hero__title {
  margin: 0;

  color: var(--md3-on-surface);

  font-size: clamp(1.75rem, 3.4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.1;
}

.camps-hero__highlight {
  display: inline-block;

  padding: 0.04em 0.35em 0.1em;
  border-radius: 0.32em 0.9em 0.32em 0.9em;

  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);

  transform: rotate(-1.2deg);
}

.camps-hero__subtitle {
  max-width: 46ch;
  margin: 6px 0 0;

  color: var(--md3-on-surface-variant);

  font-size: 0.95rem;
  line-height: 1.5;
}

.camps-hero__search {
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

.camps-hero__search:focus-within {
  border-color: var(--md3-primary);
  box-shadow: 0 0 0 3px rgba(var(--md3-primary-rgb), 0.16);
}

.camps-hero__search-icon {
  color: var(--md3-on-surface-variant);
}

.camps-hero__search :deep(.q-field__control),
.camps-hero__search :deep(input) {
  height: 50px;
  font-size: 1rem;
}

/* ======================================================= RESULTS */
.camps-results {
  display: flex;
  flex-direction: column;
  gap: 12px;

  padding-top: 12px;
}

.camps__skeletons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 16px;
  align-items: stretch;
}

.camps__footer {
  padding: 16px 0 32px;
}

.camps__footer-text {
  margin: 0;

  color: var(--md3-on-surface-variant);

  font-size: 0.9rem;
  text-align: center;
}

/* Expressive asymmetric corner, as on the landing page's split cards */
.camps-empty {
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: clamp(40px, 6vw, 72px) clamp(24px, 5vw, 56px);
  border-radius: var(--md3-corner-extra-large) var(--md3-corner-extra-large)
    var(--md3-corner-extra-large) 72px;

  background: var(--md3-surface-container-low);
  text-align: center;
}

.camps-empty__icon {
  display: inline-flex;

  padding: 14px;
  border-radius: var(--md3-corner-large);

  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.camps-empty__icon--tertiary {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.camps-empty__title {
  margin: 20px 0 0;

  color: var(--md3-on-surface);

  font-size: clamp(1.25rem, 2.4vw, 1.6rem);
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.camps-empty__text {
  max-width: 48ch;
  margin: 10px 0 20px;

  color: var(--md3-on-surface-variant);

  font-size: 1rem;
  line-height: 1.55;
}

/* ===================================================== ENTRANCE */
@media (prefers-reduced-motion: no-preference) {
  .anim {
    animation: camps-rise 0.7s var(--md3-easing-emphasized-decel) both;
  }

  .anim--1 {
    animation-delay: 0.05s;
  }

  .anim--2 {
    animation-delay: 0.15s;
  }
}

@keyframes camps-rise {
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
  .camps {
    padding: 0 16px 40px;
  }

  .camps-hero {
    gap: 14px;
  }

  .camps-hero__search {
    flex-basis: 100%;
    height: 50px;
  }

  .camps-hero__search :deep(.q-field__control),
  .camps-hero__search :deep(input) {
    height: 48px;
  }

  .camps-empty {
    border-radius: var(--md3-corner-extra-large) var(--md3-corner-extra-large)
      var(--md3-corner-extra-large) 48px;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Find your'
title_highlight: 'next camp'
subtitle: 'Every camp currently open for registration.'
search: 'Search by name'
loading: 'Loading camps…'
count: 'No camps | 1 camp | {count} camps'
empty:
  title: 'No camps open right now'
  message: 'Check back soon — new camps will appear here as soon as registration opens.'
no_results:
  title: 'No camps match your filters'
  message: 'Try a wider date range or another country, or clear the filters to see everything.'
  action: 'Clear filters'
load_error: 'More camps could not be loaded.'
retry: 'Try again'
end_of_list: 'That is every camp open right now.'
</i18n>
<i18n lang="yaml" locale="de">
title: 'Finde dein'
title_highlight: 'nächstes Camp'
subtitle: 'Alle Camps, die gerade zur Anmeldung geöffnet sind.'
search: 'Nach Name suchen'
loading: 'Camps werden geladen…'
count: 'Keine Camps | 1 Camp | {count} Camps'
empty:
  title: 'Aktuell sind keine Camps geöffnet'
  message: 'Schau bald wieder vorbei – neue Camps erscheinen hier, sobald die Anmeldung beginnt.'
no_results:
  title: 'Keine Camps passen zu deinen Filtern'
  message: 'Probiere einen größeren Zeitraum oder ein anderes Land, oder setze die Filter zurück.'
  action: 'Filter zurücksetzen'
load_error: 'Weitere Camps konnten nicht geladen werden.'
retry: 'Erneut versuchen'
end_of_list: 'Das sind alle derzeit geöffneten Camps.'
</i18n>
<i18n lang="yaml" locale="fr">
title: 'Trouve ton'
title_highlight: 'prochain camp'
subtitle: 'Tous les camps actuellement ouverts aux inscriptions.'
search: 'Rechercher par nom'
loading: 'Chargement des camps…'
count: 'Aucun camp | 1 camp | {count} camps'
empty:
  title: 'Aucun camp ouvert pour le moment'
  message: "Reviens bientôt – les nouveaux camps apparaîtront ici dès l'ouverture des inscriptions."
no_results:
  title: 'Aucun camp ne correspond à tes filtres'
  message: 'Essaie une période plus large ou un autre pays, ou efface les filtres pour tout voir.'
  action: 'Effacer les filtres'
load_error: "D'autres camps n'ont pas pu être chargés."
retry: 'Réessayer'
end_of_list: 'Ce sont tous les camps actuellement ouverts.'
</i18n>
<i18n lang="yaml" locale="pl">
title: 'Znajdź swój'
title_highlight: 'następny obóz'
subtitle: 'Wszystkie obozy, na które trwają obecnie zapisy.'
search: 'Szukaj po nazwie'
loading: 'Ładowanie obozów…'
# Count-invariant phrasing — no Polish plural rules are configured
count: 'Obozy: {count}'
empty:
  title: 'Obecnie brak otwartych obozów'
  message: 'Zajrzyj wkrótce – nowe obozy pojawią się tutaj, gdy tylko rozpoczną się zapisy.'
no_results:
  title: 'Żaden obóz nie pasuje do filtrów'
  message: 'Spróbuj szerszego zakresu dat lub innego kraju, albo wyczyść filtry, aby zobaczyć wszystko.'
  action: 'Wyczyść filtry'
load_error: 'Nie udało się wczytać kolejnych obozów.'
retry: 'Spróbuj ponownie'
end_of_list: 'To wszystkie obecnie otwarte obozy.'
</i18n>
<i18n lang="yaml" locale="cs">
title: 'Najdi svůj'
title_highlight: 'další tábor'
subtitle: 'Všechny tábory, které jsou právě otevřené k registraci.'
search: 'Hledat podle názvu'
loading: 'Načítání táborů…'
# Count-invariant phrasing — no Czech plural rules are configured
count: 'Tábory: {count}'
empty:
  title: 'Momentálně nejsou otevřené žádné tábory'
  message: 'Zastav se brzy znovu – nové tábory se zde objeví, jakmile se otevře registrace.'
no_results:
  title: 'Žádný tábor neodpovídá filtrům'
  message: 'Zkus širší období nebo jinou zemi, případně zruš filtry a zobraz vše.'
  action: 'Zrušit filtry'
load_error: 'Další tábory se nepodařilo načíst.'
retry: 'Zkusit znovu'
end_of_list: 'To jsou všechny právě otevřené tábory.'
</i18n>
