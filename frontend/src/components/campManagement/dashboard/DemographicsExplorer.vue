<template>
  <q-card
    flat
    bordered
    class="rounded-borders"
  >
    <q-card-section class="q-pb-none">
      <div class="text-subtitle1 text-weight-medium">{{ t('title') }}</div>
      <div class="text-caption text-grey-6">{{ t('subtitle') }}</div>
    </q-card-section>

    <q-card-section class="column q-gutter-md">
      <!-- Controls: reads like "Show [Age] split by [Gender]" -->
      <div class="row items-center q-gutter-sm">
        <span class="text-body2 text-grey-8">{{ t('show') }}</span>
        <q-select
          v-model="xDimension"
          :options="xOptions"
          emit-value
          map-options
          outlined
          dense
          options-dense
          style="min-width: 130px"
        />
        <span class="text-body2 text-grey-8">{{ t('splitBy') }}</span>
        <q-select
          v-model="groupDimension"
          :options="groupOptions"
          emit-value
          map-options
          outlined
          dense
          options-dense
          style="min-width: 130px"
        />

        <q-space class="gt-xs" />

        <q-toggle
          v-if="grouped"
          v-model="stacked"
          :label="t('stack.stacked')"
          dense
        />
      </div>

      <!-- Filters (only the dimensions not already on the axis) -->
      <div
        v-if="showGenderFilter || showCountryFilter"
        class="row q-col-gutter-md"
      >
        <div
          v-if="showGenderFilter"
          class="col-12 col-sm-6"
        >
          <q-select
            v-model="genderFilter"
            :options="genderFilterOptions"
            :label="t('filter.gender')"
            multiple
            clearable
            use-chips
            emit-value
            map-options
            outlined
            dense
            options-dense
          />
        </div>
        <div
          v-if="showCountryFilter"
          class="col-12 col-sm-6"
        >
          <q-select
            v-model="countryFilter"
            :options="countryFilterOptions"
            :label="t('filter.country')"
            multiple
            clearable
            use-chips
            emit-value
            map-options
            outlined
            dense
            options-dense
          />
        </div>
      </div>

      <!-- Chart -->
      <div class="dashboard-chart">
        <apexchart
          v-if="hasData"
          type="bar"
          height="340"
          :options="chartOptions"
          :series="chartSeries"
        />
        <div
          v-else
          class="column items-center justify-center text-grey-6"
          style="height: 340px"
        >
          <q-icon
            name="bar_chart"
            size="48px"
          />
          <div class="q-mt-sm">{{ t('empty') }}</div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { Registration } from '@camp-registration/common/entities';
import {
  useCampStatistics,
  type Dimension,
} from 'src/composables/campStatistics';
import { useRegistrationHelper } from 'src/composables/registrationHelper';

const props = defineProps<{
  people: Registration[];
}>();

const { t, locale } = useI18n();
const quasar = useQuasar();
const stats = useCampStatistics();
const helper = useRegistrationHelper();

const xDimension = ref<Dimension>('age');
const groupDimension = ref<Dimension | 'none'>('none');
const stacked = ref<boolean>(true);
const genderFilter = ref<string[]>([]);
const countryFilter = ref<string[]>([]);

const countryAvailable = computed(() => stats.hasMultipleCountries.value);

const grouped = computed(() => groupDimension.value !== 'none');

// --- Dimension option lists ------------------------------------------------

const allDimensions = computed<Dimension[]>(() => {
  const dims: Dimension[] = ['age', 'gender'];
  if (countryAvailable.value) {
    dims.push('country');
  }
  return dims;
});

const xOptions = computed(() =>
  allDimensions.value.map((value) => ({
    label: t(`dimension.${value}`),
    value,
  })),
);

const groupOptions = computed(() => [
  { label: t('dimension.none'), value: 'none' as const },
  ...allDimensions.value
    .filter((value) => value !== xDimension.value)
    .map((value) => ({ label: t(`dimension.${value}`), value })),
]);

// Keep the breakdown valid when the x-axis changes.
watch([xDimension, countryAvailable], () => {
  if (
    groupDimension.value !== 'none' &&
    (groupDimension.value === xDimension.value ||
      (groupDimension.value === 'country' && !countryAvailable.value))
  ) {
    groupDimension.value = 'none';
  }
});

// --- Value display helpers -------------------------------------------------

const regionNames = computed(() => {
  try {
    return new Intl.DisplayNames([locale.value], { type: 'region' });
  } catch {
    return null;
  }
});

function genderLabel(value: string): string {
  if (value === stats.UNKNOWN) {
    return t('unknown');
  }
  const key = `gender.${value.toLowerCase()}`;
  const translated = t(key);
  // vue-i18n returns the key itself when missing.
  return translated === key ? value : translated;
}

function countryLabel(value: string): string {
  if (value === stats.UNKNOWN) {
    return t('unknown');
  }
  const upper = value.toUpperCase();
  try {
    return regionNames.value?.of(upper) ?? upper;
  } catch {
    return upper;
  }
}

function labelFor(dimension: Dimension, value: string): string {
  if (dimension === 'gender') {
    return genderLabel(value);
  }
  if (dimension === 'country') {
    return countryLabel(value);
  }
  return value === stats.UNKNOWN ? t('unknown') : value;
}

// --- Filtering -------------------------------------------------------------

const filteredPeople = computed<Registration[]>(() => {
  return props.people.filter((registration) => {
    if (genderFilter.value.length > 0) {
      const value = helper.gender(registration) ?? stats.UNKNOWN;
      if (!genderFilter.value.includes(value)) {
        return false;
      }
    }
    if (countryFilter.value.length > 0) {
      const value = helper.country(registration) ?? stats.UNKNOWN;
      if (!countryFilter.value.includes(value)) {
        return false;
      }
    }
    return true;
  });
});

const showGenderFilter = computed(
  () => xDimension.value !== 'gender' && stats.presentGenders.value.length > 0,
);
const showCountryFilter = computed(
  () => xDimension.value !== 'country' && countryAvailable.value,
);

const genderFilterOptions = computed(() =>
  stats.presentGenders.value.map((value) => ({
    label: genderLabel(value),
    value,
  })),
);
const countryFilterOptions = computed(() =>
  stats.presentCountries.value.map((value) => ({
    label: countryLabel(value),
    value,
  })),
);

// Drop filter selections that no longer apply (e.g. dimension became the axis).
watch(showGenderFilter, (visible) => {
  if (!visible) {
    genderFilter.value = [];
  }
});
watch(showCountryFilter, (visible) => {
  if (!visible) {
    countryFilter.value = [];
  }
});

// --- Chart data ------------------------------------------------------------

const crossTab = computed(() =>
  stats.crossTab(
    filteredPeople.value,
    xDimension.value,
    grouped.value ? (groupDimension.value as Dimension) : undefined,
  ),
);

const hasData = computed(() => filteredPeople.value.length > 0);

const horizontal = computed(
  () => quasar.screen.lt.sm || crossTab.value.categories.length > 12,
);

const chartSeries = computed(() => {
  if (!grouped.value) {
    return [
      {
        name: t('count'),
        data: crossTab.value.series[0]?.data ?? [],
      },
    ];
  }
  return crossTab.value.series.map((s) => ({
    name: labelFor(groupDimension.value as Dimension, s.name),
    data: s.data,
  }));
});

const chartOptions = computed(() => {
  const categories = crossTab.value.categories.map((c) =>
    labelFor(xDimension.value, c),
  );
  const isStacked = grouped.value && stacked.value;

  return {
    chart: {
      type: 'bar',
      stacked: isStacked,
      toolbar: { show: false },
      fontFamily: 'inherit',
      animations: { speed: 250 },
    },
    plotOptions: {
      bar: {
        horizontal: horizontal.value,
        borderRadius: 4,
        borderRadiusApplication: 'end',
        columnWidth: '65%',
      },
    },
    dataLabels: { enabled: false },
    legend: {
      show: grouped.value,
      position: 'top',
      horizontalAlign: 'left',
    },
    grid: { strokeDashArray: 4 },
    xaxis: {
      categories,
      title: { text: t(`dimension.${xDimension.value}`) },
    },
    yaxis: {
      title: { text: horizontal.value ? undefined : t('count') },
      labels: {
        formatter: (val: number) => `${Math.round(val)}`,
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${Math.round(val)}`,
      },
    },
    noData: { text: t('empty') },
  };
});
</script>

<style scoped>
.dashboard-chart {
  min-height: 340px;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Demographics'
subtitle: 'Break down the group by age, gender and country.'
show: 'Show'
splitBy: 'split by'
count: 'People'
empty: 'No data to display.'
unknown: 'Unknown'
dimension:
  none: 'Nothing'
  age: 'Age'
  gender: 'Gender'
  country: 'Country'
stack:
  stacked: 'Stacked'
filter:
  gender: 'Filter by gender'
  country: 'Filter by country'
gender:
  male: 'Male'
  female: 'Female'
  diverse: 'Diverse'
  other: 'Other'
  m: 'Male'
  f: 'Female'
  d: 'Diverse'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Demografie'
subtitle: 'Gruppe nach Alter, Geschlecht und Land aufschlüsseln.'
show: 'Zeige'
splitBy: 'aufgeteilt nach'
count: 'Personen'
empty: 'Keine Daten vorhanden.'
unknown: 'Unbekannt'
dimension:
  none: 'Nichts'
  age: 'Alter'
  gender: 'Geschlecht'
  country: 'Land'
stack:
  stacked: 'Gestapelt'
filter:
  gender: 'Nach Geschlecht filtern'
  country: 'Nach Land filtern'
gender:
  male: 'Männlich'
  female: 'Weiblich'
  diverse: 'Divers'
  other: 'Andere'
  m: 'Männlich'
  f: 'Weiblich'
  d: 'Divers'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Démographie'
subtitle: 'Répartir le groupe par âge, genre et pays.'
show: 'Afficher'
splitBy: 'réparti par'
count: 'Personnes'
empty: 'Aucune donnée à afficher.'
unknown: 'Inconnu'
dimension:
  none: 'Rien'
  age: 'Âge'
  gender: 'Genre'
  country: 'Pays'
stack:
  stacked: 'Empilé'
filter:
  gender: 'Filtrer par genre'
  country: 'Filtrer par pays'
gender:
  male: 'Masculin'
  female: 'Féminin'
  diverse: 'Divers'
  other: 'Autre'
  m: 'Masculin'
  f: 'Féminin'
  d: 'Divers'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Demografia'
subtitle: 'Podziel grupę według wieku, płci i kraju.'
show: 'Pokaż'
splitBy: 'z podziałem na'
count: 'Osoby'
empty: 'Brak danych do wyświetlenia.'
unknown: 'Nieznane'
dimension:
  none: 'Nic'
  age: 'Wiek'
  gender: 'Płeć'
  country: 'Kraj'
stack:
  stacked: 'Skumulowane'
filter:
  gender: 'Filtruj według płci'
  country: 'Filtruj według kraju'
gender:
  male: 'Mężczyzna'
  female: 'Kobieta'
  diverse: 'Inna'
  other: 'Inne'
  m: 'Mężczyzna'
  f: 'Kobieta'
  d: 'Inna'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Demografie'
subtitle: 'Rozdělte skupinu podle věku, pohlaví a země.'
show: 'Zobrazit'
splitBy: 'rozděleno podle'
count: 'Osoby'
empty: 'Žádná data k zobrazení.'
unknown: 'Neznámé'
dimension:
  none: 'Nic'
  age: 'Věk'
  gender: 'Pohlaví'
  country: 'Země'
stack:
  stacked: 'Skládané'
filter:
  gender: 'Filtrovat podle pohlaví'
  country: 'Filtrovat podle země'
gender:
  male: 'Muž'
  female: 'Žena'
  diverse: 'Jiné'
  other: 'Jiné'
  m: 'Muž'
  f: 'Žena'
  d: 'Jiné'
</i18n>
