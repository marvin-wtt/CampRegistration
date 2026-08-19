<template>
  <div class="camp-filters">
    <!-- Narrow screens keep the controls folded away: four stacked fields would
         push the results below the fold. -->
    <div
      v-if="!controlsAlwaysVisible"
      class="camp-filters__bar"
    >
      <m-btn
        :tonal="expanded"
        :text="!expanded"
        icon="tune"
        :label="t('filters')"
        :aria-expanded="expanded"
        data-test="camps-filter-toggle"
        @click="expanded = !expanded"
      >
        <q-badge
          v-if="activeFilters.length > 0"
          floating
          rounded
          color="primary"
          :label="activeFilters.length"
        />
      </m-btn>
    </div>

    <q-slide-transition>
      <div v-show="expanded || controlsAlwaysVisible">
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              v-model.number="age"
              type="number"
              :label="t('age')"
              :min="0"
              :max="99"
              data-test="camps-filter-age"
              debounce="400"
              dense
              outlined
              rounded
              clearable
              hide-bottom-space
            >
              <template #prepend>
                <q-icon name="cake" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <date-range-input
              v-model:from="startAt"
              v-model:to="endAt"
              :label="t('dates')"
              default-start-time="00:00"
              default-end-time="23:59"
              data-test="camps-filter-dates"
              dense
              clearable
              hide-bottom-space
            >
              <template #prepend>
                <q-icon name="event" />
              </template>
            </date-range-input>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <country-select
              v-model="countries"
              :label="t('countries')"
              :countries="CAMP_COUNTRIES"
              :display-value="countriesDisplayValue"
              data-test="camps-filter-countries"
              multiple
              popup-no-route-dismiss
              dense
              outlined
              rounded
              clearable
              hide-bottom-space
            >
              <template #prepend>
                <q-icon name="public" />
              </template>
            </country-select>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="sort"
              :options="sortOptions"
              :label="t('sort_label')"
              data-test="camps-filter-sort"
              popup-no-route-dismiss
              dense
              outlined
              rounded
              emit-value
              map-options
              options-dense
              hide-bottom-space
            >
              <template #prepend>
                <q-icon name="swap_vert" />
              </template>
            </q-select>
          </div>
        </div>
      </div>
    </q-slide-transition>

    <!-- What is actually narrowing the results, and how to undo each piece -->
    <div
      v-if="activeFilters.length > 0"
      class="camp-filters__active"
    >
      <q-chip
        v-for="filter in activeFilters"
        :key="filter.key"
        removable
        :label="filter.label"
        class="active-chip"
        :data-test="`camps-active-${filter.key}`"
        @remove="filter.clear()"
      />

      <m-btn
        text
        dense
        icon="filter_alt_off"
        :label="t('clear')"
        data-test="camps-filter-clear"
        @click="emit('clear')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { date as dateUtil, useQuasar } from 'quasar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import CountrySelect from '@/components/common/CountrySelect.vue';
import DateRangeInput from '@/components/common/inputs/DateRangeInput.vue';
import { countryName } from '@/utils/countries';
import {
  CAMP_COUNTRIES,
  CAMP_SORT_OPTIONS,
  type CampSortOption,
} from '@/components/camps/filters';

const emit = defineEmits<{
  clear: [];
}>();

// Nullable: the hero's clearable search input emits null when cleared.
const search = defineModel<string | null>('search', { default: '' });
const countries = defineModel<string[] | undefined>('countries');
const age = defineModel<number | undefined>('age');
// ISO datetime strings, which is what CampQuery.startAt/endAt expect.
const startAt = defineModel<string | undefined>('startAt');
const endAt = defineModel<string | undefined>('endAt');
const sort = defineModel<CampSortOption>('sort', { required: true });

const { t, locale } = useI18n();
const quasar = useQuasar();

const controlsAlwaysVisible = computed<boolean>(() => quasar.screen.gt.xs);

const expanded = ref<boolean>(false);

const sortOptions = computed(() =>
  CAMP_SORT_OPTIONS.map((value) => ({ value, label: t(`sort.${value}`) })),
);

/** Two or more countries would overflow the field; a count reads better. */
const countriesDisplayValue = computed<string | undefined>(() => {
  const selected = countries.value ?? [];

  return selected.length > 1
    ? t('countries_selected', { count: selected.length })
    : undefined;
});

interface ActiveFilter {
  key: string;
  label: string;
  clear: () => void;
}

const activeFilters = computed<ActiveFilter[]>(() => {
  const filters: ActiveFilter[] = [];

  if (search.value) {
    filters.push({
      key: 'search',
      label: t('chip.search', { value: search.value }),
      clear: () => (search.value = ''),
    });
  }

  for (const code of countries.value ?? []) {
    filters.push({
      key: `country-${code}`,
      label: countryName(code, locale.value),
      clear: () =>
        (countries.value = (countries.value ?? []).filter(
          (value) => value !== code,
        )),
    });
  }

  if (age.value !== undefined && age.value !== null) {
    filters.push({
      key: 'age',
      label: t('chip.age', { value: age.value }),
      clear: () => (age.value = undefined),
    });
  }

  if (startAt.value ?? endAt.value) {
    filters.push({
      key: 'dates',
      label: dateLabel.value,
      clear: () => {
        startAt.value = undefined;
        endAt.value = undefined;
      },
    });
  }

  return filters;
});

const dateLabel = computed<string>(() => {
  const from = formatDay(startAt.value);
  const to = formatDay(endAt.value);

  if (from && to) {
    return `${from} – ${to}`;
  }

  return from ?? to ?? '';
});

function formatDay(iso?: string): string | undefined {
  return iso ? dateUtil.formatDate(new Date(iso), 'DD.MM.YYYY') : undefined;
}
</script>

<style scoped>
.camp-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.camp-filters__bar {
  display: flex;
  align-items: center;
}

.camp-filters__active {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.active-chip {
  margin: 0;

  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface);
}
</style>

<i18n lang="yaml" locale="en">
filters: 'Filters'
countries: 'Countries'
countries_selected: '{count} countries'
age: 'Age'
dates: 'Dates'
sort_label: 'Sort'
sort:
  start_asc: 'Starting soonest'
  start_desc: 'Starting latest'
  price_asc: 'Lowest price'
  price_desc: 'Highest price'
clear: 'Clear all'
chip:
  search: 'Search: {value}'
  age: 'Age {value}'
</i18n>

<i18n lang="yaml" locale="de">
filters: 'Filter'
countries: 'Länder'
countries_selected: '{count} Länder'
age: 'Alter'
dates: 'Zeitraum'
sort_label: 'Sortierung'
sort:
  start_asc: 'Beginnt am frühesten'
  start_desc: 'Beginnt am spätesten'
  price_asc: 'Niedrigster Preis'
  price_desc: 'Höchster Preis'
clear: 'Alle zurücksetzen'
chip:
  search: 'Suche: {value}'
  age: 'Alter {value}'
</i18n>

<i18n lang="yaml" locale="fr">
filters: 'Filtres'
countries: 'Pays'
countries_selected: '{count} pays'
age: 'Âge'
dates: 'Période'
sort_label: 'Trier'
sort:
  start_asc: 'Commence le plus tôt'
  start_desc: 'Commence le plus tard'
  price_asc: 'Prix le plus bas'
  price_desc: 'Prix le plus élevé'
clear: 'Tout effacer'
chip:
  search: 'Recherche : {value}'
  age: 'Âge {value}'
</i18n>

<i18n lang="yaml" locale="pl">
filters: 'Filtry'
countries: 'Kraje'
countries_selected: 'Kraje: {count}'
age: 'Wiek'
dates: 'Termin'
sort_label: 'Sortowanie'
sort:
  start_asc: 'Najbliższy termin'
  start_desc: 'Najpóźniejszy termin'
  price_asc: 'Najniższa cena'
  price_desc: 'Najwyższa cena'
clear: 'Wyczyść wszystko'
chip:
  search: 'Szukaj: {value}'
  age: 'Wiek {value}'
</i18n>

<i18n lang="yaml" locale="cs">
filters: 'Filtry'
countries: 'Země'
countries_selected: 'Země: {count}'
age: 'Věk'
dates: 'Období'
sort_label: 'Řazení'
sort:
  start_asc: 'Nejbližší začátek'
  start_desc: 'Nejpozdější začátek'
  price_asc: 'Nejnižší cena'
  price_desc: 'Nejvyšší cena'
clear: 'Vymazat vše'
chip:
  search: 'Hledání: {value}'
  age: 'Věk {value}'
</i18n>
