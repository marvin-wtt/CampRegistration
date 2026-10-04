<template>
  <demographics-explorer
    v-if="expanded"
    :people
    :loading
    collapsible
    @collapse="expanded = false"
  />
  <q-card
    v-else
    flat
    bordered
    class="summary-card"
  >
    <q-card-section>
      <dashboard-card-header
        icon="bar_chart"
        tone="tertiary"
        :title="t('title')"
      >
        <template #caption>
          <q-skeleton
            v-if="loading"
            type="text"
            width="40%"
          />
          <template v-else>{{ t('people', people.length) }}</template>
        </template>
        <template #action>
          <m-btn
            :label="t('explore')"
            :disable="loading || people.length === 0"
            icon="unfold_more"
            primary
            tonal
            no-caps
            data-test="dashboard-demographics-explore"
            @click="expanded = true"
          />
        </template>
      </dashboard-card-header>
    </q-card-section>

    <q-card-section
      v-if="loading || people.length > 0"
      class="summary-section q-pt-none"
    >
      <div class="summary-grid">
        <div class="summary-tile">
          <div class="summary-label">{{ t('age') }}</div>
          <q-skeleton
            v-if="loading"
            type="rect"
            height="32px"
          />
          <div
            v-else
            class="age-row"
          >
            <div
              class="age-bars"
              aria-hidden="true"
            >
              <span
                v-for="band in ageBands"
                :key="band.label"
                class="age-bar"
                :style="{ height: `${(band.count / agePeak) * 100}%` }"
              >
                <q-tooltip>{{ band.label }}: {{ band.count }}</q-tooltip>
              </span>
            </div>
            <span class="summary-value">{{ ageRange }}</span>
          </div>
        </div>

        <div class="summary-tile">
          <div class="summary-label">{{ t('gender') }}</div>
          <q-skeleton
            v-if="loading"
            type="text"
            width="70%"
          />
          <div
            v-else
            class="summary-value"
          >
            {{ genderSplit }}
          </div>
        </div>

        <div
          v-if="stats.hasMultipleCountries.value"
          class="summary-tile"
        >
          <div class="summary-label">{{ t('countries') }}</div>
          <q-skeleton
            v-if="loading"
            type="text"
            width="70%"
          />
          <div
            v-else
            class="summary-value"
          >
            {{ topCountries }}
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Registration } from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import DemographicsExplorer from '@/components/event/dashboard/DemographicsExplorer.vue';
import { useEventStatistics } from '@/composables/eventStatistics';
import { useRegistrationHelper } from '@/composables/registrationHelper';

// A one-line digest; the full explorer opens on demand.
const { people, loading = false } = defineProps<{
  people: Registration[];
  loading?: boolean;
}>();

const { t, locale } = useI18n();
const stats = useEventStatistics();
const helper = useRegistrationHelper();

const expanded = ref(false);

const ageBands = computed(() => {
  const tab = stats.crossTab(people, 'age');
  const counts = tab.series[0]?.data ?? [];
  return tab.categories
    .map((label, i) => ({ label, count: counts[i] ?? 0 }))
    .filter((band) => band.label !== stats.UNKNOWN);
});

const agePeak = computed<number>(() =>
  Math.max(1, ...ageBands.value.map((band) => band.count)),
);

const ageRange = computed<string>(() => {
  const ages = people
    .map((r) => helper.age(r))
    .filter((age): age is number => age != null);
  if (ages.length === 0) {
    return '—';
  }
  const min = Math.min(...ages);
  const max = Math.max(...ages);
  return min === max
    ? t('years', { range: min })
    : t('years', { range: `${min}–${max}` });
});

const percent = computed(
  () => new Intl.NumberFormat(locale.value, { style: 'percent' }),
);

function share(count: number): string {
  return percent.value.format(count / people.length);
}

const genderSplit = computed<string>(() => {
  const counts = new Map<string, number>();
  for (const registration of people) {
    const gender = helper.gender(registration)?.toLowerCase();
    if (gender) {
      counts.set(gender, (counts.get(gender) ?? 0) + 1);
    }
  }
  if (counts.size === 0) {
    return '—';
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([gender, count]) => `${share(count)} ${genderLabel(gender)}`)
    .join(' · ');
});

function genderLabel(value: string): string {
  const key = `genders.${value}`;
  const translated = t(key);
  return translated === key ? value : translated;
}

const regionNames = computed(() => {
  try {
    return new Intl.DisplayNames([locale.value], { type: 'region' });
  } catch {
    return null;
  }
});

const topCountries = computed<string>(() => {
  const counts = new Map<string, number>();
  for (const registration of people) {
    const country = helper.country(registration);
    if (country) {
      counts.set(country, (counts.get(country) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([country, count]) => {
      const upper = country.toUpperCase();
      let name = upper;
      try {
        name = regionNames.value?.of(upper) ?? upper;
      } catch {
        // Not a region code: show it as stored.
      }
      return `${name} ${share(count)}`;
    })
    .join(' · ');
});
</script>

<style scoped>
.summary-card {
  border-radius: 16px;
}

.summary-section {
  container-type: inline-size;
}

.summary-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.summary-tile {
  min-width: 0;
  padding: 10px 14px;
  background: var(--md3-surface-container-low);
  border-radius: 12px;
}

.summary-label {
  margin-bottom: 4px;
  color: var(--md3-on-surface-variant);
  font-size: 0.75rem;
  font-weight: 500;
}

.summary-value {
  color: var(--md3-on-surface);
  font-size: 0.875rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.age-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.age-bars {
  display: flex;
  flex: 0 1 120px;
  align-items: flex-end;
  gap: 2px;
  height: 32px;
}

.age-bar {
  flex: 1 1 0;
  min-height: 2px;
  background: var(--md3-tertiary);
  border-radius: 2px 2px 0 0;
}

@container (min-width: 560px) {
  .summary-grid {
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Demographics'
people: 'No confirmed participants yet | 1 confirmed participant | {n} confirmed participants'
explore: 'Explore'
age: 'Age'
gender: 'Gender'
countries: 'Top countries'
years: '{range} years'
genders:
  m: 'male'
  f: 'female'
  d: 'diverse'
  male: 'male'
  female: 'female'
  diverse: 'diverse'
  other: 'other'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Demografie'
people: 'Noch keine bestätigten Teilnehmenden | 1 bestätigte Person | {n} bestätigte Teilnehmende'
explore: 'Erkunden'
age: 'Alter'
gender: 'Geschlecht'
countries: 'Häufigste Länder'
years: '{range} Jahre'
genders:
  m: 'männlich'
  f: 'weiblich'
  d: 'divers'
  male: 'männlich'
  female: 'weiblich'
  diverse: 'divers'
  other: 'andere'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Démographie'
people: 'Aucun participant confirmé | 1 participant confirmé | {n} participants confirmés'
explore: 'Explorer'
age: 'Âge'
gender: 'Genre'
countries: 'Principaux pays'
years: '{range} ans'
genders:
  m: 'masculin'
  f: 'féminin'
  d: 'divers'
  male: 'masculin'
  female: 'féminin'
  diverse: 'divers'
  other: 'autre'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Demografia'
people: 'Brak potwierdzonych uczestników | 1 potwierdzony uczestnik | {n} potwierdzonych uczestników'
explore: 'Analizuj'
age: 'Wiek'
gender: 'Płeć'
countries: 'Najczęstsze kraje'
years: '{range} lat'
genders:
  m: 'mężczyźni'
  f: 'kobiety'
  d: 'inna'
  male: 'mężczyźni'
  female: 'kobiety'
  diverse: 'inna'
  other: 'inna'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Demografie'
people: 'Zatím žádní potvrzení účastníci | 1 potvrzený účastník | {n} potvrzených účastníků'
explore: 'Prozkoumat'
age: 'Věk'
gender: 'Pohlaví'
countries: 'Nejčastější země'
years: '{range} let'
genders:
  m: 'muži'
  f: 'ženy'
  d: 'jiné'
  male: 'muži'
  female: 'ženy'
  diverse: 'jiné'
  other: 'jiné'
</i18n>
