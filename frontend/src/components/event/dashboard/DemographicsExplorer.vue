<template>
  <q-card
    flat
    bordered
    class="demographics-card"
  >
    <q-card-section class="demographics-header">
      <dashboard-card-header
        icon="bar_chart"
        tone="tertiary"
        :title="t('title')"
        :caption="t('subtitle')"
      >
        <template #action>
          <q-skeleton
            v-if="loading"
            type="QChip"
            width="120px"
          />
          <div
            v-else
            class="people-count"
            :class="{ 'people-count--filtered': hasActiveFilters }"
          >
            <q-icon
              name="groups"
              size="18px"
            />
            <span>
              {{
                hasActiveFilters
                  ? t('shown', {
                      shown: filteredPeople.length,
                      total: people.length,
                    })
                  : t('total', { total: people.length })
              }}
            </span>
            <!-- Resetting lives here, not in the filter row, so turning a
                 filter on never reflows the controls. -->
            <q-btn
              v-if="hasActiveFilters"
              :aria-label="t('resetFilters')"
              icon="close"
              size="sm"
              class="people-count__reset"
              flat
              round
              dense
              @click="resetFilters"
            >
              <q-tooltip>{{ t('resetFilters') }}</q-tooltip>
            </q-btn>
          </div>
        </template>
      </dashboard-card-header>
    </q-card-section>

    <q-card-section class="demographics-controls">
      <div class="control-group">
        <div class="control-label">{{ t('viewBy') }}</div>
        <m-btn-group
          connected
          class="segmented"
        >
          <m-btn
            v-for="option in xOptions"
            :key="option.value"
            class="q-btn--toggle"
            :class="{ 'q-btn--selected': xDimension === option.value }"
            :aria-pressed="xDimension === option.value"
            :label="option.label"
            primary
            no-caps
            @click="xDimension = option.value"
          />
        </m-btn-group>
      </div>

      <div class="control-group">
        <div class="control-label">{{ t('breakdown') }}</div>
        <div class="row no-wrap items-center q-gutter-x-sm">
          <m-btn-group
            connected
            class="segmented"
          >
            <m-btn
              v-for="option in groupOptions"
              :key="option.value"
              class="q-btn--toggle"
              :class="{ 'q-btn--selected': groupDimension === option.value }"
              :aria-pressed="groupDimension === option.value"
              :label="option.label"
              primary
              no-caps
              @click="groupDimension = option.value"
            />
          </m-btn-group>
          <m-btn-group
            v-if="grouped"
            connected
            :aria-label="t('stack.label')"
          >
            <m-btn
              v-for="option in stackOptions"
              :key="option.value"
              class="q-btn--toggle"
              :class="{ 'q-btn--selected': barLayout === option.value }"
              :aria-pressed="barLayout === option.value"
              :icon="option.icon"
              :aria-label="option.label"
              primary
              @click="barLayout = option.value"
            >
              <q-tooltip>{{ option.label }}</q-tooltip>
            </m-btn>
          </m-btn-group>
        </div>
      </div>

      <div
        v-if="!loading && (showGenderFilter || showCountryFilter)"
        class="control-group filter-group"
      >
        <div class="control-label">{{ t('filters') }}</div>
        <div class="row items-center q-gutter-sm filter-buttons">
          <m-btn
            v-for="filter in filters"
            :key="filter.key"
            :label="filter.label"
            :tonal="filter.model.value.length > 0"
            :outline="filter.model.value.length === 0"
            :icon="filter.model.value.length > 0 ? 'check' : 'filter_list'"
            icon-right="arrow_drop_down"
            primary
            no-caps
          >
            <q-menu
              anchor="bottom left"
              self="top left"
              class="rounded-md"
            >
              <q-list dense>
                <q-item
                  v-for="option in filter.options"
                  :key="option.value"
                  v-ripple
                  tag="label"
                  clickable
                >
                  <q-item-section side>
                    <q-checkbox
                      v-model="filter.model.value"
                      :val="option.value"
                      color="primary"
                      dense
                    />
                  </q-item-section>
                  <q-item-section>{{ option.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </m-btn>
        </div>
      </div>
    </q-card-section>

    <q-card-section class="chart-section">
      <div class="dashboard-chart">
        <q-skeleton
          v-if="loading"
          type="rect"
          height="340px"
          class="chart-skeleton"
        />
        <template v-else-if="hasData">
          <!-- Our own tooltip rather than the library's: it is placed above
               the column (or beside it), never on the bars it describes. -->
          <div
            ref="chartWrap"
            class="chart-wrap"
            @mouseleave="activeIndex = null"
          >
            <apex-chart
              type="bar"
              height="340"
              :options="chartOptions"
              :series="chartSeries"
            />
            <div
              v-if="readout"
              ref="tooltipEl"
              class="chart-tooltip"
              role="status"
              :style="tooltipStyle"
            >
              <div class="chart-tooltip__title">{{ readout.category }}</div>
              <div
                v-for="item in readout.items"
                :key="item.name"
                class="chart-tooltip__row"
              >
                <span
                  class="chart-tooltip__dot"
                  :style="{ background: item.color }"
                />
                <span class="chart-tooltip__name">{{ item.name }}</span>
                <strong>{{ item.value }}</strong>
              </div>
              <div
                v-if="grouped"
                class="chart-tooltip__total"
              >
                {{ t('readoutTotal', { n: readout.total }) }}
              </div>
            </div>
          </div>
        </template>
        <div
          v-else
          class="chart-empty column items-center justify-center"
        >
          <q-icon
            name="bar_chart"
            size="48px"
          />
          <div class="q-mt-sm">{{ t('empty') }}</div>
          <m-btn
            v-if="hasActiveFilters"
            :label="t('resetFilters')"
            icon="filter_list_off"
            class="q-mt-sm"
            primary
            text
            no-caps
            @click="resetFilters"
          />
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
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { MBtnGroup } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtnGroup';
import type { Registration } from '@camp-registration/common/entities';
import {
  useEventStatistics,
  type Dimension,
} from '@/composables/eventStatistics';
import { useRegistrationHelper } from '@/composables/registrationHelper';

// While `loading` the header and dimension controls render for real; the count
// chip and the chart area are skeletonized.
const { people, loading = false } = defineProps<{
  people: Registration[];
  loading?: boolean;
}>();

const { t, locale } = useI18n();
const quasar = useQuasar();
const stats = useEventStatistics();
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
const barLayout = ref<'grouped' | 'stacked'>('grouped');
const genderFilter = ref<string[]>([]);
const countryFilter = ref<string[]>([]);

const countryAvailable = computed(() => stats.hasMultipleCountries.value);

// Only the user's explicit pick is state; the default and its validity are
// derived, because this card renders (behind skeletons) before the
// registrations have loaded, when whether the event spans countries isn't
// known yet. A pick that doesn't apply to the current axis or data shows as
// 'none' without being discarded.
const groupChoice = ref<Dimension | 'none' | null>(null);

const groupDimension = computed<Dimension | 'none'>({
  get: () => {
    const group =
      groupChoice.value ?? (countryAvailable.value ? 'country' : 'gender');
    if (
      group === xDimension.value ||
      (group === 'country' && !countryAvailable.value)
    ) {
      return 'none';
    }
    return group;
  },
  set: (value) => {
    groupChoice.value = value;
  },
});

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

const stackOptions = computed(() => [
  { label: t('stack.grouped'), value: 'grouped' as const, icon: 'bar_chart' },
  {
    label: t('stack.stacked'),
    value: 'stacked' as const,
    icon: 'stacked_bar_chart',
  },
]);

const groupOptions = computed(() => [
  { label: t('dimension.none'), value: 'none' as const },
  ...allDimensions.value
    .filter((value) => value !== xDimension.value)
    .map((value) => ({ label: t(`dimension.${value}`), value })),
]);

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

const hasActiveFilters = computed(
  () => genderFilter.value.length > 0 || countryFilter.value.length > 0,
);

function resetFilters() {
  genderFilter.value = [];
  countryFilter.value = [];
}

function filterLabel(
  dimension: Dimension,
  selected: string[],
  options: { label: string; value: string }[],
): string {
  const name = t(`dimension.${dimension}`);
  if (selected.length === 0) {
    return name;
  }
  if (selected.length === 1) {
    return options.find((o) => o.value === selected[0])?.label ?? name;
  }
  return t('filterCount', { name, count: selected.length });
}

const filters = computed(() => {
  const list = [];
  if (showGenderFilter.value) {
    list.push({
      key: 'gender',
      model: genderFilter,
      options: genderFilterOptions.value,
      label: filterLabel(
        'gender',
        genderFilter.value,
        genderFilterOptions.value,
      ),
    });
  }
  if (showCountryFilter.value) {
    list.push({
      key: 'country',
      model: countryFilter,
      options: countryFilterOptions.value,
      label: filterLabel(
        'country',
        countryFilter.value,
        countryFilterOptions.value,
      ),
    });
  }
  return list;
});

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

// The category under the pointer, or the last one tapped on touch screens.
const activeIndex = ref<number | null>(null);

watch(crossTab, () => {
  activeIndex.value = null;
});

function seriesColor(index: number): string {
  const colors = themeColors.value.series;
  return colors[index % colors.length] ?? '';
}

const readout = computed(() => {
  const index = activeIndex.value;
  const category = crossTab.value.categories[index ?? -1];
  if (index === null || category === undefined) {
    return null;
  }
  const items = chartSeries.value.map((series, i) => ({
    name: series.name,
    color: seriesColor(i),
    value: series.data[index] ?? 0,
  }));
  const label = labelFor(xDimension.value, category);

  return {
    category:
      xDimension.value === 'age' ? `${t('dimension.age')} ${label}` : label,
    items,
    total: items.reduce((sum, item) => sum + item.value, 0),
  };
});

const chartWrap = ref<HTMLElement>();
const tooltipEl = ref<HTMLElement>();
const tooltipPosition = ref<{ left: number; top: number } | null>(null);

const tooltipStyle = computed(() =>
  tooltipPosition.value
    ? {
        left: `${tooltipPosition.value.left}px`,
        top: `${tooltipPosition.value.top}px`,
      }
    : { visibility: 'hidden' as const },
);

// Above the column when there is room, otherwise beside it; horizontal bars
// prefer the space after the row. Rendered hidden first, so it can be measured.
async function placeTooltip() {
  tooltipPosition.value = null;
  const index = activeIndex.value;
  if (index === null) {
    return;
  }
  await nextTick();
  const wrap = chartWrap.value;
  const tip = tooltipEl.value;
  if (!wrap || !tip) {
    return;
  }

  const box = wrap.getBoundingClientRect();
  const bars = [
    ...wrap.querySelectorAll(`.apexcharts-bar-area[j="${index}"]`),
  ].map((bar) => bar.getBoundingClientRect());
  if (bars.length === 0) {
    return;
  }

  const left = Math.min(...bars.map((r) => r.left)) - box.left;
  const right = Math.max(...bars.map((r) => r.right)) - box.left;
  const top = Math.min(...bars.map((r) => r.top)) - box.top;
  const bottom = Math.max(...bars.map((r) => r.bottom)) - box.top;
  const width = tip.offsetWidth;
  const height = tip.offsetHeight;
  const gap = 8;
  const clampX = (x: number) => Math.min(Math.max(x, 0), box.width - width);
  // It may rise above the chart, over the controls, up to the card's edge.
  const card = wrap.closest('.demographics-card');
  const minTop = card ? card.getBoundingClientRect().top - box.top + gap : 0;
  const clampY = (y: number) =>
    Math.min(Math.max(y, minTop), box.height - height);
  const middleY = clampY((top + bottom) / 2 - height / 2);

  if (horizontal.value) {
    tooltipPosition.value =
      right + gap + width <= box.width
        ? { left: right + gap, top: middleY }
        : {
            left: clampX(right - width),
            top: Math.max(minTop, top - gap - height),
          };
    return;
  }

  if (top - gap - height >= minTop) {
    tooltipPosition.value = {
      left: clampX((left + right) / 2 - width / 2),
      top: top - gap - height,
    };
  } else if (right + gap + width <= box.width) {
    tooltipPosition.value = { left: right + gap, top: middleY };
  } else {
    tooltipPosition.value = { left: clampX(left - gap - width), top: middleY };
  }
}

watch(activeIndex, () => void placeTooltip());

const chartOptions = computed<ApexOptions>(() => {
  const categories = crossTab.value.categories.map((c) =>
    labelFor(xDimension.value, c),
  );
  const isStacked = grouped.value && barLayout.value === 'stacked';

  return {
    chart: {
      type: 'bar',
      stacked: isStacked,
      toolbar: { show: false },
      fontFamily: 'inherit',
      animations: { speed: 250 },
      background: 'transparent',
      foreColor: themeColors.value.foreColor,
      events: {
        dataPointMouseEnter: (_e, _chart, opts) => {
          activeIndex.value = opts?.dataPointIndex ?? null;
        },
        dataPointMouseLeave: () => {
          activeIndex.value = null;
        },
        // Touch screens have no hover: a tap pins the tooltip instead, and a
        // tap beside the bars clears it.
        dataPointSelection: (_e, _chart, opts) => {
          activeIndex.value = opts?.dataPointIndex ?? null;
        },
        click: (_e, _chart, opts) => {
          if ((opts?.dataPointIndex ?? -1) < 0) {
            activeIndex.value = null;
          }
        },
      },
    },
    theme: { mode: quasar.dark.isActive ? 'dark' : 'light' },
    colors: themeColors.value.series,
    plotOptions: {
      bar: {
        horizontal: horizontal.value,
        borderRadius: 6,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
        columnWidth: grouped.value && !isStacked ? '72%' : '48%',
        barHeight: grouped.value && !isStacked ? '72%' : '60%',
      },
    },
    // A thin gap in the surface color separates adjacent bars of a group.
    stroke: {
      show: grouped.value,
      width: 2,
      colors: ['transparent'],
    },
    dataLabels: { enabled: false },
    states: {
      hover: { filter: { type: 'darken' } },
      active: {
        filter: { type: 'none' },
        allowMultipleDataPointsSelection: false,
      },
    },
    legend: {
      show: grouped.value,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '13px',
      markers: { shape: 'circle', size: 6 },
      itemMargin: { horizontal: 12, vertical: 4 },
    },
    grid: {
      strokeDashArray: 4,
      borderColor: themeColors.value.gridColor,
      padding: { left: 8, right: 8 },
      xaxis: { lines: { show: horizontal.value } },
      yaxis: { lines: { show: !horizontal.value } },
    },
    // The axes are named by the controls above, so they carry no titles.
    xaxis: {
      categories,
      axisBorder: {
        show: !horizontal.value,
        color: themeColors.value.gridColor,
      },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: '13px' },
        ...(horizontal.value
          ? { formatter: (val: string) => `${Math.round(Number(val))}` }
          : {}),
      },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: {
        style: { fontSize: '12px' },
        ...(horizontal.value
          ? {}
          : { formatter: (val: number) => `${Math.round(val)}` }),
      },
    },
    tooltip: { enabled: false },
    noData: { text: t('empty') },
  };
});
</script>

<style scoped>
.demographics-card {
  overflow: hidden;
  border-radius: 16px;
}

.demographics-header {
  padding-bottom: 0;
}

.people-count {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.people-count--filtered {
  padding-right: 4px;
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.people-count__reset {
  margin: -4px 0;
}

.demographics-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px 32px;
  padding: 16px 20px;
}

.control-group {
  min-width: 0;
}

.filter-group {
  margin-left: auto;
}

.control-label {
  margin-bottom: 6px;
  color: var(--md3-on-surface-variant);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.dashboard-chart {
  min-height: 340px;
}

.chart-section {
  padding: 0 12px 12px;
}

.chart-wrap {
  position: relative;
}

.chart-tooltip {
  position: absolute;
  z-index: 2;
  min-width: 140px;
  padding: 8px 12px;
  color: var(--md3-on-surface);
  font-size: 0.8125rem;
  pointer-events: none;
  background: var(--md3-surface-container-highest);
  border: 1px solid var(--md3-outline-variant);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}

.chart-tooltip__title {
  margin-bottom: 4px;
  font-weight: 600;
}

.chart-tooltip__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-tooltip__name {
  flex: 1 1 auto;
  color: var(--md3-on-surface-variant);
}

.chart-tooltip__dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chart-tooltip__total {
  margin-top: 4px;
  padding-top: 4px;
  color: var(--md3-on-surface-variant);
  border-top: 1px solid var(--md3-outline-variant);
}

.chart-skeleton {
  border-radius: 12px;
}

.chart-empty {
  height: 340px;
  color: var(--md3-on-surface-variant);
}

@media (max-width: 1023px) {
  .filter-group {
    margin-left: 0;
  }
}

@media (max-width: 599px) {
  .demographics-controls {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }

  .segmented {
    display: flex;
    flex: 1 1 auto;
  }

  .segmented > :deep(.q-btn) {
    flex: 1 1 0;
    min-width: 0;
  }

  .chart-section {
    padding: 0 4px 8px;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Demographics'
subtitle: 'Break down the group by age, gender and country.'
shown: '{shown} of {total} people'
total: '{total} people'
filterCount: '{name} ({count})'
resetFilters: 'Reset filters'
viewBy: 'View by'
breakdown: 'Breakdown'
filters: 'Filters'
count: 'People'
readoutTotal: '{n} in total'
empty: 'No data to display.'
unknown: 'Unknown'
dimension:
  none: 'Nothing'
  age: 'Age'
  gender: 'Gender'
  country: 'Country'
stack:
  label: 'Bar layout'
  grouped: 'Grouped'
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
shown: '{shown} von {total} Personen'
total: '{total} Personen'
filterCount: '{name} ({count})'
resetFilters: 'Filter zurücksetzen'
viewBy: 'Ansicht nach'
breakdown: 'Aufschlüsselung'
filters: 'Filter'
count: 'Personen'
readoutTotal: '{n} gesamt'
empty: 'Keine Daten vorhanden.'
unknown: 'Unbekannt'
dimension:
  none: 'Nichts'
  age: 'Alter'
  gender: 'Geschlecht'
  country: 'Land'
stack:
  label: 'Balken-Layout'
  grouped: 'Gruppiert'
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
shown: '{shown} personnes sur {total}'
total: '{total} personnes'
filterCount: '{name} ({count})'
resetFilters: 'Réinitialiser les filtres'
viewBy: 'Afficher par'
breakdown: 'Répartition'
filters: 'Filtres'
count: 'Personnes'
readoutTotal: '{n} au total'
empty: 'Aucune donnée à afficher.'
unknown: 'Inconnu'
dimension:
  none: 'Rien'
  age: 'Âge'
  gender: 'Genre'
  country: 'Pays'
stack:
  label: 'Disposition des barres'
  grouped: 'Groupé'
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
shown: '{shown} z {total} osób'
total: '{total} osób'
filterCount: '{name} ({count})'
resetFilters: 'Wyczyść filtry'
viewBy: 'Pokaż według'
breakdown: 'Podział'
filters: 'Filtry'
count: 'Osoby'
readoutTotal: 'Razem: {n}'
empty: 'Brak danych do wyświetlenia.'
unknown: 'Nieznane'
dimension:
  none: 'Nic'
  age: 'Wiek'
  gender: 'Płeć'
  country: 'Kraj'
stack:
  label: 'Układ słupków'
  grouped: 'Zgrupowane'
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
shown: '{shown} z {total} osob'
total: '{total} osob'
filterCount: '{name} ({count})'
resetFilters: 'Zrušit filtry'
viewBy: 'Zobrazit podle'
breakdown: 'Rozdělení'
filters: 'Filtry'
count: 'Osoby'
readoutTotal: 'Celkem: {n}'
empty: 'Žádná data k zobrazení.'
unknown: 'Neznámé'
dimension:
  none: 'Nic'
  age: 'Věk'
  gender: 'Pohlaví'
  country: 'Země'
stack:
  label: 'Rozložení sloupců'
  grouped: 'Seskupené'
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
