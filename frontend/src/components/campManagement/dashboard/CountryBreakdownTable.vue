<template>
  <div>
    <div class="q-mb-sm">
      <div class="text-overline text-primary text-weight-bold">
        {{ t('eyebrow') }}
      </div>
      <div class="text-h6 text-weight-bold">
        {{ t('title') }}
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div
        v-for="row in rows"
        :key="row.country"
        class="col-12 col-sm-6 col-lg-4"
      >
        <q-card
          flat
          bordered
          class="full-height country-card"
        >
          <q-card-section class="q-pb-sm">
            <!-- Header: flag + country -->
            <div class="row items-center no-wrap q-gutter-sm">
              <country-icon
                :country="row.country"
                class="country-flag"
              />
              <div class="col text-weight-medium ellipsis">
                {{ countryLabel(row.country) }}
              </div>
              <q-chip
                dense
                square
                color="tertiary"
                text-color="white"
                icon="supervisor_account"
                class="team-chip"
              >
                {{ row.team }}
                <q-tooltip>
                  {{ t('team') }}
                </q-tooltip>
              </q-chip>
            </div>

            <!-- Capacity -->
            <div class="row items-baseline justify-between q-mt-md">
              <span class="text-caption text-grey-7">
                {{ t('accepted') }}
              </span>
              <span class="text-body2">
                <span class="text-weight-medium text-h6">
                  {{ row.accepted }}
                </span>
                <span
                  v-if="row.max != null"
                  class="text-grey-6"
                >
                  / {{ row.max }}</span
                >
              </span>
            </div>
            <q-linear-progress
              :value="fillRatio(row)"
              :color="fillColor(row)"
              track-color="grey-5"
              rounded
              size="8px"
              class="q-mt-xs"
            />
          </q-card-section>

          <q-separator />

          <!-- Secondary stats -->
          <q-card-section class="row q-col-gutter-sm q-pt-sm">
            <div :class="tileColClass">
              <div class="stat-tile">
                <div
                  class="text-weight-medium"
                  :class="(row.free ?? 0) > 0 ? 'text-positive' : 'text-grey-7'"
                >
                  {{ row.free ?? '—' }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ t('free') }}
                </div>
              </div>
            </div>
            <div
              v-if="showPending"
              :class="tileColClass"
            >
              <div class="stat-tile">
                <div
                  class="text-weight-medium"
                  :class="row.pending > 0 ? 'text-warning' : 'text-grey-7'"
                >
                  {{ row.pending }}
                </div>
                <div class="text-caption text-grey-7">{{ t('pending') }}</div>
              </div>
            </div>
            <div :class="tileColClass">
              <div class="stat-tile">
                <div
                  class="text-weight-medium text-grey-8"
                  :class="row.waitlisted > 0 ? 'text-negative' : 'text-grey-7'"
                >
                  {{ row.waitlisted }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ t('waitlisted') }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CountryStats } from '@/composables/campStatistics';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';

const { showPending = true } = defineProps<{
  rows: CountryStats[];
  showPending?: boolean;
}>();

const { t, locale } = useI18n();

// Two tiles split evenly, three tiles into thirds.
const tileColClass = computed<string>(() => (showPending ? 'col-4' : 'col-6'));

const regionNames = computed(() => {
  try {
    return new Intl.DisplayNames([locale.value], { type: 'region' });
  } catch {
    return null;
  }
});

function countryLabel(value: string): string {
  const upper = value.toUpperCase();
  try {
    return regionNames.value?.of(upper) ?? upper;
  } catch {
    return upper;
  }
}

function fillRatio(row: CountryStats): number {
  if (row.max == null || row.max === 0) {
    return 0;
  }
  return Math.min(1, row.accepted / row.max);
}

function fillColor(row: CountryStats): string {
  const ratio = fillRatio(row);
  if (ratio >= 1) {
    return 'negative';
  }
  if (ratio >= 0.85) {
    return 'orange';
  }
  return 'primary';
}
</script>

<style scoped>
.country-card {
  border-radius: 16px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.country-card:hover {
  box-shadow: 0 8px 22px rgba(38, 50, 56, 0.09);
  transform: translateY(-2px);
}

.country-flag {
  width: 1.75em;
  border-radius: 3px;
}

.team-chip {
  font-weight: 600;
}

.stat-tile {
  text-align: center;
  line-height: 1.2;
}

:global(.body--dark) .country-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}
</style>

<i18n lang="yaml" locale="en">
eyebrow: 'International overview'
title: 'Registration by country'
team: 'Team members'
accepted: 'Accepted'
free: 'Free'
pending: 'Pending'
waitlisted: 'Waitlist'
</i18n>

<i18n lang="yaml" locale="de">
eyebrow: 'Internationale Übersicht'
title: 'Anmeldungen nach Land'
team: 'Teammitglieder'
accepted: 'Bestätigt'
free: 'Frei'
pending: 'Ausstehend'
waitlisted: 'Warteliste'
</i18n>

<i18n lang="yaml" locale="fr">
eyebrow: 'Aperçu international'
title: 'Inscriptions par pays'
team: "Membres de l'équipe"
accepted: 'Acceptés'
free: 'Libres'
pending: 'En attente'
waitlisted: "Liste d'attente"
</i18n>

<i18n lang="yaml" locale="pl">
eyebrow: 'Przegląd międzynarodowy'
title: 'Rejestracje według kraju'
team: 'Członkowie zespołu'
accepted: 'Zaakceptowani'
free: 'Wolne'
pending: 'Oczekujący'
waitlisted: 'Lista rezerwowa'
</i18n>

<i18n lang="yaml" locale="cs">
eyebrow: 'Mezinárodní přehled'
title: 'Registrace podle země'
team: 'Členové týmu'
accepted: 'Přijatí'
free: 'Volná'
pending: 'Čekající'
waitlisted: 'Čekací listina'
</i18n>
