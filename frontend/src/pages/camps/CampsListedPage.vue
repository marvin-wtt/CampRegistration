<template>
  <page-state-handler
    :error="fatalError"
    padding
    class="row justify-center"
  >
    <div class="camp-index col-12 col-md-11 col-lg-10 col-xl-8 column no-wrap">
      <!-- Hero: the page's whole job is "find a camp", so search leads. -->
      <section class="camp-hero">
        <span
          class="camp-hero__shape camp-hero__shape--top"
          aria-hidden="true"
        />
        <span
          class="camp-hero__shape camp-hero__shape--bottom"
          aria-hidden="true"
        />

        <div class="camp-hero__content">
          <h1 class="camp-hero__title">
            {{ t('title') }}
          </h1>
          <p class="camp-hero__subtitle">
            {{ t('subtitle') }}
          </p>

          <div class="camp-hero__search">
            <q-icon
              name="search"
              size="24px"
              class="camp-hero__search-icon"
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
        </div>
      </section>

      <camp-filter-bar
        v-model:search="search"
        v-model:countries="countries"
        v-model:age="age"
        v-model:start-at="startAt"
        v-model:end-at="endAt"
        v-model:sort="sort"
        class="camp-index__filters"
        @clear="clearFilters"
      />

      <!-- Result count. `role=status` so the change is announced, not just seen. -->
      <div
        class="camp-index__count"
        role="status"
        aria-live="polite"
        data-test="camps-count"
      >
        {{
          initialLoading ? t('loading') : t('count', { count: total }, total)
        }}
      </div>

      <!-- Loading -->
      <div
        v-if="initialLoading"
        class="camp-index__skeletons"
      >
        <camp-card-skeleton
          v-for="n in 6"
          :key="n"
        />
      </div>

      <!-- Nothing matches the current filters -->
      <div
        v-else-if="camps.length === 0 && activeFilterCount > 0"
        class="empty-state column items-center justify-center"
        data-test="camps-no-results"
      >
        <q-icon
          name="search_off"
          size="64px"
          class="empty-icon"
        />
        <div class="text-h6 q-mt-md">
          {{ t('no_results.title') }}
        </div>
        <div class="camp-index__muted text-body2 q-mt-xs text-center">
          {{ t('no_results.message') }}
        </div>
        <m-btn
          class="q-mt-md"
          tonal
          icon="filter_alt_off"
          :label="t('no_results.action')"
          @click="clearFilters"
        />
      </div>

      <!-- Nothing open at all -->
      <div
        v-else-if="camps.length === 0"
        class="empty-state column items-center justify-center"
        data-test="camps-empty"
      >
        <q-icon
          name="travel_explore"
          size="64px"
          class="empty-icon"
        />
        <div class="text-h6 q-mt-md">
          {{ t('empty.title') }}
        </div>
        <div class="camp-index__muted text-body2 q-mt-xs text-center">
          {{ t('empty.message') }}
        </div>
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
          <div class="camp-index__footer">
            <div
              v-if="loadingMore"
              class="camp-index__skeletons"
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
              <div class="camp-index__muted text-body2">
                {{ t('load_error') }}
              </div>
              <m-btn
                text
                icon="refresh"
                :label="t('retry')"
                @click="loadMore"
              />
            </div>

            <div
              v-else-if="!hasMore"
              class="camp-index__muted text-body2 text-center"
            >
              {{ t('end_of_list') }}
            </div>
          </div>
        </template>
      </camp-grid>
    </div>
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
.camp-index {
  min-width: 0;
}

.camp-index__muted {
  color: var(--md3-on-surface-variant);
}

/* Hero */
.camp-hero {
  position: relative;

  /* Clears the layout's floating header pills */
  margin-top: 1rem;
  padding: 40px 32px;
  border-radius: 28px;
  overflow: hidden;

  background: linear-gradient(
    135deg,
    var(--md3-primary-container),
    var(--md3-tertiary-container)
  );
  color: var(--md3-on-primary-container);
}

/* Same soft-shape language as the camp card banners */
.camp-hero__shape {
  position: absolute;
  border-radius: 50%;

  background: currentColor;
  opacity: 0.08;
}

.camp-hero__shape--top {
  top: -120px;
  right: -60px;
  width: 280px;
  height: 280px;
}

.camp-hero__shape--bottom {
  bottom: -100px;
  left: -40px;
  width: 200px;
  height: 200px;
}

.camp-hero__content {
  position: relative;

  max-width: 640px;
}

.camp-hero__title {
  margin: 0;

  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.camp-hero__subtitle {
  margin: 12px 0 0;

  font-size: 1rem;
  line-height: 1.5;

  opacity: 0.85;
}

.camp-hero__search {
  display: flex;
  align-items: center;
  gap: 12px;

  margin-top: 28px;
  height: 56px;
  padding: 0 12px 0 20px;
  border-radius: 28px;

  background: var(--md3-surface);
  color: var(--md3-on-surface);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 2px 6px 2px rgba(0, 0, 0, 0.15);
}

.camp-hero__search-icon {
  color: var(--md3-on-surface-variant);
}

.camp-hero__search :deep(.q-field__control) {
  height: 56px;
}

.camp-index__filters {
  margin-top: 24px;
}

.camp-index__count {
  margin: 24px 0 12px;

  color: var(--md3-on-surface-variant);

  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.camp-index__skeletons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 16px;
  align-items: stretch;
}

.camp-index__footer {
  padding: 8px 0 32px;
}

.empty-state {
  padding: 64px 16px;
}

.empty-icon {
  color: var(--md3-on-surface-variant);

  opacity: 0.6;
}

@media (max-width: 599px) {
  .camp-hero {
    padding: 28px 20px;
    border-radius: 24px;
  }

  .camp-hero__search {
    margin-top: 20px;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Find your camp'
subtitle: 'Browse the camps that are open for registration right now.'
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
title: 'Finde dein Camp'
subtitle: 'Entdecke die Camps, die gerade zur Anmeldung geöffnet sind.'
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
title: 'Trouve ton camp'
subtitle: 'Découvre les camps actuellement ouverts aux inscriptions.'
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
title: 'Znajdź swój obóz'
subtitle: 'Przeglądaj obozy, na które trwają obecnie zapisy.'
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
title: 'Najdi svůj tábor'
subtitle: 'Prohlédni si tábory, které jsou právě otevřené k registraci.'
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
