<template>
  <q-card
    flat
    bordered
    class="demographics-card"
  >
    <q-card-section class="demographics-header">
      <div>
        <div class="text-overline text-primary text-weight-bold">
          {{ t('eyebrow') }}
        </div>
        <div class="text-h6 text-weight-bold">{{ t('title') }}</div>
        <div class="text-caption text-grey-7">{{ t('subtitle') }}</div>
      </div>
      <q-chip
        color="primary"
        text-color="white"
        icon="groups"
        :label="
          t('shown', { shown: filteredPeople.length, total: people.length })
        "
        class="q-ma-none"
      />
    </q-card-section>

    <q-separator />

    <q-card-section class="demographics-controls">
      <div class="control-block">
        <div class="control-label">{{ t('viewBy') }}</div>
        <div class="dimension-buttons">
          <q-btn
            v-for="option in xOptions"
            :key="option.value"
            :label="option.label"
            :outline="xDimension !== option.value"
            :unelevated="xDimension === option.value"
            :color="xDimension === option.value ? 'primary' : 'grey-7'"
            no-caps
            @click="xDimension = option.value"
          />
        </div>
      </div>

      <div class="control-block breakdown-control">
        <div class="control-label">{{ t('breakdown') }}</div>
        <q-select
          v-model="groupDimension"
          :options="groupOptions"
          emit-value
          map-options
          outlined
          rounded
          dense
          options-dense
          class="breakdown-select"
        />
        <q-toggle
          v-if="grouped"
          v-model="stacked"
          :label="t('stack.stacked')"
          dense
        />
      </div>
    </q-card-section>

    <q-card-section
      v-if="showGenderFilter || showCountryFilter"
      class="filter-bar"
    >
      <div class="filter-label">
        <q-icon
          name="filter_alt"
          size="18px"
        />
        <span>{{ t('filters') }}</span>
      </div>
      <div class="filter-fields">
        <div v-if="showGenderFilter">
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
            rounded
            dense
            options-dense
          />
        </div>
        <div v-if="showCountryFilter">
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
            rounded
            dense
            options-dense
          />
        </div>
      </div>
    </q-card-section>

    <q-card-section class="chart-section">
      <div class="dashboard-chart">
        <apex-chart
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
import ApexChart from 'vue3-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { Registration } from '@camp-registration/common/entities';
import {
  useCampStatistics,
  type Dimension,
} from 'src/composables/campStatistics';
import { useRegistrationHelper } from 'src/composables/registrationHelper';

const { people } = defineProps<{
  people: Registration[];
}>();

const { t, locale } = useI18n();
const quasar = useQuasar();
const stats = useCampStatistics();
const helper = useRegistrationHelper();

// ApexCharts renders to SVG and needs concrete color values, so we read the
// live MD3 design tokens off <body> instead of passing CSS variables. The
// values swap when the dark-mode class toggles, so we re-read on that change.
function readThemeColors() {
  const styles = getComputedStyle(document.body);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  return {
    series: [
      token('--md3-primary'),
      token('--md3-tertiary'),
      token('--md3-secondary'),
      token('--md3-positive'),
      token('--md3-info'),
      token('--md3-warning'),
      token('--md3-error'),
    ].filter(Boolean),
    foreColor: token('--md3-on-surface-variant'),
    gridColor: token('--md3-outline-variant'),
  };
}

const themeColors = ref(readThemeColors());

watch(
  () => quasar.dark.isActive,
  () => {
    void nextTick(() => {
      themeColors.value = readThemeColors();
    });
  },
);

onMounted(() => {
  themeColors.value = readThemeColors();
});

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
  return people.filter((registration) => {
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

const chartOptions = computed<ApexOptions>(() => {
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
      background: 'transparent',
      foreColor: themeColors.value.foreColor,
    },
    theme: { mode: quasar.dark.isActive ? 'dark' : 'light' },
    colors: themeColors.value.series,
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
    grid: {
      strokeDashArray: 4,
      borderColor: themeColors.value.gridColor,
    },
    xaxis: {
      categories,
      title: { text: t(`dimension.${xDimension.value}`) },
    },
    yaxis: {
      title: { text: horizontal.value ? '' : t('count') },
      labels: {
        formatter: (val: number) => `${Math.round(val)}`,
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${Math.round(val)}`,
      },
      theme: quasar.dark.isActive ? 'dark' : 'light',
    },
    noData: { text: t('empty') },
  };
});
</script>

<style scoped>
.dashboard-chart {
  min-height: 340px;
}

.demographics-card {
  overflow: hidden;
  border-radius: 16px;
}

.demographics-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
}

.demographics-controls {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 1fr);
  gap: 24px;
  padding: 16px 20px;
}

.control-block {
  min-width: 0;
}

.control-label,
.filter-label {
  margin-bottom: 8px;
  color: var(--md3-on-surface-variant);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dimension-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.breakdown-control {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) auto;
  align-items: end;
  gap: 8px 16px;
}

.breakdown-control .control-label {
  grid-column: 1 / -1;
}

.filter-bar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 16px;
  padding: 14px 20px;
  background: var(--md3-surface-container-low);
  border-block: 1px solid var(--md3-outline-variant);
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 9px;
  margin-bottom: 0;
}

.filter-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.chart-section {
  padding: 12px 20px 20px;
}

@media (max-width: 899px) {
  .demographics-controls {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}

@media (max-width: 599px) {
  .demographics-header {
    flex-direction: column;
    padding: 16px;
  }

  .demographics-controls {
    padding: 16px;
  }

  .dimension-buttons > .q-btn {
    flex: 1 1 auto;
  }

  .breakdown-control {
    grid-template-columns: 1fr;
  }

  .breakdown-control .control-label {
    grid-column: auto;
  }

  .filter-bar {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 14px 16px;
  }

  .filter-label {
    margin-top: 0;
  }

  .filter-fields {
    grid-template-columns: 1fr;
  }

  .chart-section {
    padding: 8px 8px 16px;
  }

  .dashboard-chart {
    margin-inline: -8px;
  }
}
</style>

<i18n lang="yaml" locale="en">
eyebrow: 'Group insights'
title: 'Demographics'
subtitle: 'Break down the group by age, gender and country.'
shown: '{shown} of {total} people'
viewBy: 'View by'
breakdown: 'Breakdown'
filters: 'Filters'
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
eyebrow: 'Einblicke in die Gruppe'
title: 'Demografie'
subtitle: 'Gruppe nach Alter, Geschlecht und Land aufschlüsseln.'
shown: '{shown} von {total} Personen'
viewBy: 'Ansicht nach'
breakdown: 'Aufschlüsselung'
filters: 'Filter'
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
eyebrow: 'Aperçu du groupe'
title: 'Démographie'
subtitle: 'Répartir le groupe par âge, genre et pays.'
shown: '{shown} personnes sur {total}'
viewBy: 'Afficher par'
breakdown: 'Répartition'
filters: 'Filtres'
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
eyebrow: 'Informacje o grupie'
title: 'Demografia'
subtitle: 'Podziel grupę według wieku, płci i kraju.'
shown: '{shown} z {total} osób'
viewBy: 'Pokaż według'
breakdown: 'Podział'
filters: 'Filtry'
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
eyebrow: 'Informace o skupině'
title: 'Demografie'
subtitle: 'Rozdělte skupinu podle věku, pohlaví a země.'
shown: '{shown} z {total} osob'
viewBy: 'Zobrazit podle'
breakdown: 'Rozdělení'
filters: 'Filtry'
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
