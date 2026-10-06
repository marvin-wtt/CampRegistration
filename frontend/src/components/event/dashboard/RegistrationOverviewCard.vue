<template>
  <q-card
    flat
    bordered
    class="overview-card"
  >
    <q-card-section class="q-pb-none">
      <dashboard-card-header
        icon="how_to_reg"
        :title="t('title')"
        :caption="t('subtitle')"
        :link="
          can('event.registrations.view')
            ? {
                label: t('openParticipants'),
                to: { name: 'management.event.participants' },
              }
            : undefined
        "
      />
    </q-card-section>

    <q-card-section class="overview-section">
      <div class="overview-grid">
        <div class="tile capacity-tile">
          <div class="tile-label">{{ t('accepted') }}</div>
          <template v-if="loading">
            <q-skeleton
              type="text"
              width="5rem"
              class="capacity-value"
            />
            <q-skeleton
              type="rect"
              height="10px"
              class="rounded-full"
            />
            <q-skeleton
              type="text"
              width="60%"
              class="q-mt-sm"
            />
          </template>
          <template v-else>
            <div class="capacity-value">
              <span>{{ split.accepted }}</span>
              <span
                v-if="max != null"
                class="capacity-max"
              >
                / {{ max }}
              </span>
            </div>
            <capacity-meter
              v-if="max != null"
              :max
              :accepted="split.accepted"
              :pending="split.pending"
              :reserved="split.reserved"
              :free="split.free"
              :overbooked="split.overbooked"
              :label="
                t('meterLabel', {
                  accepted: split.accepted,
                  pending: split.pending,
                  max,
                })
              "
              legend
            />
            <div
              v-else
              class="tile-caption"
            >
              {{ t('capacityUnset') }}
            </div>
          </template>
        </div>

        <div
          v-for="kpi in kpis"
          :key="kpi.key"
          class="tile kpi-tile"
        >
          <div class="tile-label">
            <q-icon
              :name="kpi.icon"
              size="16px"
              class="kpi-icon"
            />
            <span class="ellipsis">{{ kpi.label }}</span>
          </div>
          <q-skeleton
            v-if="loading"
            type="text"
            width="2.5rem"
            class="kpi-value"
          />
          <div
            v-else
            class="kpi-value"
          >
            {{ kpi.value }}
          </div>
          <div class="tile-caption kpi-caption">{{ kpi.caption }}</div>
        </div>
      </div>
    </q-card-section>

    <template v-if="stats.multiCountryEvent.value">
      <q-separator inset />
      <q-card-section class="country-section">
        <div class="subsection-label">{{ t('byCountry') }}</div>
        <ul class="country-list">
          <li
            v-for="row in countryRows"
            :key="row.country"
            class="country-row"
          >
            <div class="country-name">
              <country-icon
                :country="row.country"
                class="country-flag"
              />
              <span class="ellipsis">{{ countryLabel(row.country) }}</span>
            </div>
            <template v-if="loading">
              <q-skeleton
                type="rect"
                height="10px"
                class="country-meter rounded-full"
              />
              <q-skeleton
                type="text"
                width="12rem"
                class="country-stats"
              />
            </template>
            <template v-else>
              <div class="country-meter">
                <capacity-meter
                  v-if="row.max != null"
                  :max="row.max"
                  :accepted="row.accepted"
                  :pending="row.pending"
                  :reserved="row.reserved"
                  :overbooked="row.overbooked"
                  :label="
                    t('meterLabel', {
                      accepted: row.accepted,
                      pending: row.pending,
                      max: row.max,
                    })
                  "
                  class="col"
                />
                <span class="country-count">
                  <strong>{{ row.accepted }}</strong>
                  <span v-if="row.max != null"> / {{ row.max }}</span>
                </span>
              </div>
              <div class="country-stats">
                <span
                  v-for="item in row.details"
                  :key="item.key"
                  :class="`country-stat--${item.key}`"
                >
                  {{ item.text }}
                </span>
              </div>
            </template>
          </li>
        </ul>
      </q-card-section>
    </template>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import CapacityMeter from '@/components/event/dashboard/CapacityMeter.vue';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import { splitPlaces, useEventStatistics } from '@/composables/eventStatistics';
import { usePermissions } from '@/composables/permissions';

const { loading = false } = defineProps<{
  loading?: boolean;
}>();

const { t, locale } = useI18n();
const stats = useEventStatistics();
const { can } = usePermissions();

const max = computed(() => stats.capacity.value.max);

const split = computed(() => ({
  ...stats.placeSplit.value,
  accepted: stats.counts.value.accepted,
  pending: stats.counts.value.pending,
}));

const kpis = computed(() => [
  {
    key: 'waitlisted',
    label: t('kpi.waitlisted'),
    caption: t('kpi.waitlistedCaption'),
    value: stats.counts.value.waitlisted,
    icon: 'event_seat',
  },
  {
    key: 'team',
    label: t('kpi.team'),
    caption: t('kpi.teamCaption'),
    value: stats.staff.value.length,
    icon: 'supervisor_account',
  },
]);

// Zero counts are left out, except free places — "0 free" is the news.
const countryRows = computed(() =>
  stats.perCountry.value.map((row) => {
    const { reserved, overbooked } = splitPlaces([
      {
        max: row.max ?? 0,
        holding: row.accepted + row.pending,
        waitlisted: row.waitlisted,
      },
    ]);
    const details = [
      { key: 'overbooked', n: overbooked },
      { key: 'pending', n: row.pending },
      { key: 'free', n: row.free ?? 0, always: row.max != null },
      { key: 'reserved', n: reserved },
      { key: 'waitlisted', n: row.waitlisted },
      { key: 'team', n: row.team },
    ]
      .filter((item) => item.n > 0 || item.always)
      .map((item) => ({ key: item.key, text: t(`country.${item.key}`, item) }));

    return { ...row, reserved, overbooked, details };
  }),
);

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
</script>

<style scoped>
.overview-card {
  border-radius: 16px;
}

.overview-section {
  container-type: inline-size;
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.tile {
  min-width: 0;
  padding: 12px 14px;
  background: var(--md3-surface-container-low);
  border-radius: 12px;
}

.capacity-tile {
  padding: 16px;
}

/* Narrow: each figure is a label/value row, so no label gets truncated. */
.kpi-tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tile-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
  font-weight: 500;
}

.kpi-icon {
  color: var(--md3-primary);
}

.tile-caption {
  margin-top: 2px;
  color: var(--md3-on-surface-variant);
  font-size: 0.75rem;
}

.kpi-caption {
  display: none;
}

.capacity-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 2px 0 12px;
  color: var(--md3-on-surface);
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.capacity-max {
  color: var(--md3-on-surface-variant);
  font-size: 1.25rem;
  font-weight: 500;
}

.kpi-value {
  color: var(--md3-on-surface);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.15;
}

.country-section {
  container-type: inline-size;
}

.subsection-label {
  margin-bottom: 4px;
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
  font-weight: 500;
}

.country-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.country-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'name'
    'meter'
    'stats';
  gap: 6px;
  padding: 12px 0;
}

.country-row + .country-row {
  border-top: 1px solid var(--md3-outline-variant);
}

.country-name {
  display: flex;
  grid-area: name;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-weight: 500;
}

.country-flag {
  flex: 0 0 auto;
  width: 1.5em;
  border-radius: 3px;
}

.country-meter {
  display: flex;
  grid-area: meter;
  align-items: center;
  gap: 12px;
}

.country-count {
  min-width: 4em;
  color: var(--md3-on-surface-variant);
  text-align: right;
  white-space: nowrap;
}

.country-count strong {
  color: var(--md3-on-surface);
}

.country-stats {
  display: flex;
  flex-wrap: wrap;
  grid-area: stats;
  gap: 2px 14px;
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
}

.country-stat--free {
  color: var(--md3-on-surface);
  font-weight: 600;
}

.country-stat--overbooked {
  color: var(--md3-error);
  font-weight: 600;
}

@container (min-width: 640px) {
  .overview-grid {
    grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr));
  }

  .kpi-tile {
    display: block;
    padding: 16px;
  }

  .kpi-value {
    margin-top: 2px;
    font-size: 2rem;
  }

  .kpi-caption {
    display: block;
  }

  .country-row {
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    grid-template-areas:
      'name meter'
      '. stats';
    gap: 4px 20px;
    align-items: center;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Registrations'
subtitle: 'Places, waitlist and team'
openParticipants: 'All participants'
accepted: 'Confirmed participants'
capacityUnset: 'No participant limit set'
meterLabel: '{accepted} confirmed and {pending} pending of {max} places'
byCountry: 'By country'
kpi:
  waitlisted: 'Waitlist'
  waitlistedCaption: 'Waiting for a place'
  team: 'Team'
  teamCaption: 'Leaders and staff'
country:
  overbooked: '{n} overbooked'
  pending: '{n} pending'
  free: '{n} free'
  reserved: '{n} reserved for the waitlist'
  waitlisted: '{n} waitlisted'
  team: '{n} team'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Anmeldungen'
subtitle: 'Plätze, Warteliste und Team'
openParticipants: 'Alle Teilnehmenden'
accepted: 'Bestätigte Teilnehmende'
capacityUnset: 'Kein Teilnehmendenlimit festgelegt'
meterLabel: '{accepted} bestätigt und {pending} ausstehend von {max} Plätzen'
byCountry: 'Nach Land'
kpi:
  waitlisted: 'Warteliste'
  waitlistedCaption: 'Warten auf einen Platz'
  team: 'Team'
  teamCaption: 'Leitung und Mitarbeitende'
country:
  overbooked: '{n} überbucht'
  pending: '{n} ausstehend'
  free: '{n} frei'
  reserved: '{n} für die Warteliste reserviert'
  waitlisted: '{n} auf Warteliste'
  team: '{n} im Team'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Inscriptions'
subtitle: "Places, liste d'attente et équipe"
openParticipants: 'Tous les participants'
accepted: 'Participants confirmés'
capacityUnset: 'Aucune limite de participants'
meterLabel: '{accepted} confirmés et {pending} en attente sur {max} places'
byCountry: 'Par pays'
kpi:
  waitlisted: "Liste d'attente"
  waitlistedCaption: "En attente d'une place"
  team: 'Équipe'
  teamCaption: 'Responsables et équipe'
country:
  overbooked: '{n} en surréservation'
  pending: '{n} en attente'
  free: '{n} libres'
  reserved: "{n} réservées pour la liste d'attente"
  waitlisted: "{n} en liste d'attente"
  team: "{n} dans l'équipe"
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Rejestracje'
subtitle: 'Miejsca, lista rezerwowa i zespół'
openParticipants: 'Wszyscy uczestnicy'
accepted: 'Potwierdzeni uczestnicy'
capacityUnset: 'Nie ustawiono limitu uczestników'
meterLabel: 'Potwierdzeni: {accepted}, oczekujący: {pending}, miejsca: {max}'
byCountry: 'Według kraju'
kpi:
  waitlisted: 'Lista rezerwowa'
  waitlistedCaption: 'Oczekują na miejsce'
  team: 'Zespół'
  teamCaption: 'Kadra i personel'
country:
  overbooked: 'Ponad limit: {n}'
  pending: 'Oczekujący: {n}'
  free: 'Wolne: {n}'
  reserved: 'Zarezerwowane dla listy rezerwowej: {n}'
  waitlisted: 'Lista rezerwowa: {n}'
  team: 'Zespół: {n}'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Registrace'
subtitle: 'Místa, čekací listina a tým'
openParticipants: 'Všichni účastníci'
accepted: 'Potvrzení účastníci'
capacityUnset: 'Limit účastníků není nastaven'
meterLabel: 'Potvrzení: {accepted}, čekající: {pending}, místa: {max}'
byCountry: 'Podle země'
kpi:
  waitlisted: 'Čekací listina'
  waitlistedCaption: 'Čekají na místo'
  team: 'Tým'
  teamCaption: 'Vedoucí a personál'
country:
  overbooked: 'Nad kapacitu: {n}'
  pending: 'Čekající: {n}'
  free: 'Volná: {n}'
  reserved: 'Rezervováno pro čekací listinu: {n}'
  waitlisted: 'Čekací listina: {n}'
  team: 'Tým: {n}'
</i18n>
