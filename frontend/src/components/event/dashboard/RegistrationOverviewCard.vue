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
      >
        <template
          v-if="can('event.registrations.view')"
          #action
        >
          <m-btn
            :label="t('viewAll')"
            :to="{ name: 'management.event.participants' }"
            icon-right="chevron_right"
            primary
            text
            no-caps
          />
        </template>
      </dashboard-card-header>
    </q-card-section>

    <q-card-section class="overview-section">
      <div
        class="overview-grid"
        :style="{ '--kpi-count': kpis.length }"
      >
        <div class="tile capacity-tile">
          <div class="tile-label">{{ t('accepted') }}</div>
          <q-skeleton
            v-if="loading"
            type="text"
            width="5rem"
            class="capacity-value"
          />
          <div
            v-else
            class="capacity-value"
          >
            <span>{{ accepted }}</span>
            <span
              v-if="max != null"
              class="capacity-max"
            >
              / {{ max }}
            </span>
            <span
              v-if="max != null"
              class="capacity-percent"
              :class="`tone--${tone}`"
            >
              {{ percent }} %
            </span>
          </div>
          <capacity-meter
            v-if="loading || max != null"
            :ratio="loading ? 0 : ratio"
            :tone
            :label="t('accepted')"
          />
          <q-skeleton
            v-if="loading"
            type="text"
            width="40%"
            class="tile-caption"
          />
          <div
            v-else
            class="tile-caption"
          >
            <template v-if="max == null">{{ t('capacityUnset') }}</template>
            <template v-else>
              <span :class="`tone--${tone}`">
                {{ t('free', { n: stats.placeSplit.value.free }) }}
              </span>
              <span
                v-if="stats.placeSplit.value.reserved > 0"
                class="caption-detail"
              >
                · {{ t('reserved', { n: stats.placeSplit.value.reserved }) }}
              </span>
              <span
                v-if="stats.placeSplit.value.overbooked > 0"
                class="caption-detail tone--error"
              >
                ·
                {{ t('overbooked', { n: stats.placeSplit.value.overbooked }) }}
              </span>
            </template>
          </div>
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
              :class="`tone--${kpi.tone}`"
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

    <template v-if="!loading && stats.multiCountryEvent.value">
      <q-separator inset />
      <q-card-section>
        <div class="subsection-label">{{ t('byCountry') }}</div>
        <ul class="country-list">
          <li
            v-for="row in stats.perCountry.value"
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
            <div class="country-capacity">
              <capacity-meter
                :ratio="ratioOf(row.accepted, row.max)"
                :tone="toneOf(row.accepted, row.max)"
                :label="countryLabel(row.country)"
                class="col"
              />
              <span class="country-count">
                <strong>{{ row.accepted }}</strong>
                <span v-if="row.max != null"> / {{ row.max }}</span>
              </span>
            </div>
            <div class="country-stats">
              <span :class="{ 'tone--positive': (row.free ?? 0) > 0 }">
                {{ t('country.free', { n: row.free ?? '—' }) }}
              </span>
              <span
                v-if="showPending"
                :class="{ 'tone--warning': row.pending > 0 }"
              >
                {{ t('country.pending', { n: row.pending }) }}
              </span>
              <span :class="{ 'tone--error': row.waitlisted > 0 }">
                {{ t('country.waitlisted', { n: row.waitlisted }) }}
              </span>
              <span>{{ t('country.team', { n: row.team }) }}</span>
            </div>
          </li>
        </ul>
      </q-card-section>
    </template>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import CapacityMeter from '@/components/event/dashboard/CapacityMeter.vue';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import { useEventStatistics } from '@/composables/eventStatistics';
import { usePermissions } from '@/composables/permissions';

const { loading = false, showPending = true } = defineProps<{
  loading?: boolean;
  showPending?: boolean;
}>();

const { t, locale } = useI18n();
const stats = useEventStatistics();
const { can } = usePermissions();

const accepted = computed(() => stats.counts.value.accepted);
const max = computed(() => stats.capacity.value.max);

function ratioOf(value: number, limit: number | undefined): number {
  if (limit == null || limit === 0) {
    return 0;
  }
  return Math.min(1, value / limit);
}

function toneOf(
  value: number,
  limit: number | undefined,
): 'primary' | 'warning' | 'error' {
  const r = ratioOf(value, limit);
  if (limit != null && (value > limit || r >= 1)) {
    return 'error';
  }
  return r >= 0.85 ? 'warning' : 'primary';
}

const ratio = computed(() => ratioOf(accepted.value, max.value));
const percent = computed(() => Math.round(ratio.value * 100));
const tone = computed(() => toneOf(accepted.value, max.value));

const kpis = computed(() => [
  ...(showPending
    ? [
        {
          key: 'pending',
          label: t('kpi.pending'),
          caption: t('kpi.pendingCaption'),
          value: stats.counts.value.pending,
          icon: 'hourglass_top',
          tone: 'warning',
        },
      ]
    : []),
  {
    key: 'waitlisted',
    label: t('kpi.waitlisted'),
    caption: t('kpi.waitlistedCaption'),
    value: stats.counts.value.waitlisted,
    icon: 'event_seat',
    tone: 'secondary',
  },
  {
    key: 'team',
    label: t('kpi.team'),
    caption: t('kpi.teamCaption'),
    value: stats.staff.value.length,
    icon: 'supervisor_account',
    tone: 'tertiary',
  },
]);

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

.tile-caption {
  margin-top: 2px;
  color: var(--md3-on-surface-variant);
  font-size: 0.75rem;
}

.capacity-tile .tile-caption {
  margin-top: 8px;
  font-weight: 600;
}

.caption-detail {
  font-weight: 400;
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

.capacity-percent {
  margin-left: auto;
  font-size: 1rem;
  font-weight: 700;
}

.kpi-value {
  color: var(--md3-on-surface);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.15;
}

.tone--primary {
  color: var(--md3-primary);
}

.tone--secondary {
  color: var(--md3-secondary);
}

.tone--tertiary {
  color: var(--md3-tertiary);
}

.tone--warning {
  color: var(--md3-warning);
}

.tone--positive {
  color: var(--md3-positive);
}

.tone--error {
  color: var(--md3-error);
}

.subsection-label {
  margin-bottom: 8px;
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
  font-weight: 500;
}

.country-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  container-type: inline-size;
}

.country-row {
  display: grid;
  grid-template-columns: auto minmax(96px, 1fr);
  grid-template-areas:
    'name capacity'
    'stats stats';
  gap: 6px 16px;
  align-items: center;
  padding: 10px 0;
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

.country-capacity {
  display: flex;
  grid-area: capacity;
  align-items: center;
  gap: 10px;
}

.country-count {
  min-width: 4.5em;
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
  gap: 4px 16px;
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
}

@container (min-width: 640px) {
  .overview-grid {
    grid-template-columns: minmax(0, 1.8fr) repeat(
        var(--kpi-count, 3),
        minmax(0, 1fr)
      );
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
}

@container (min-width: 720px) {
  .country-row {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 1.5fr);
    grid-template-areas: 'name capacity stats';
  }

  .country-stats {
    justify-content: flex-end;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Registrations'
subtitle: 'Places, open requests and team'
viewAll: 'Participants'
accepted: 'Confirmed participants'
capacityUnset: 'No participant limit set'
free: '{n} places free'
reserved: '{n} reserved for the waitlist'
overbooked: '{n} overbooked'
byCountry: 'By country'
kpi:
  pending: 'Pending'
  pendingCaption: 'Awaiting confirmation'
  waitlisted: 'Waitlist'
  waitlistedCaption: 'Waiting for a place'
  team: 'Team'
  teamCaption: 'Leaders and staff'
country:
  free: '{n} free'
  pending: '{n} pending'
  waitlisted: '{n} waitlisted'
  team: '{n} team'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Anmeldungen'
subtitle: 'Plätze, offene Anfragen und Team'
viewAll: 'Teilnehmende'
accepted: 'Bestätigte Teilnehmende'
capacityUnset: 'Kein Teilnehmendenlimit festgelegt'
free: '{n} Plätze frei'
reserved: '{n} für die Warteliste reserviert'
overbooked: '{n} überbucht'
byCountry: 'Nach Land'
kpi:
  pending: 'Ausstehend'
  pendingCaption: 'Warten auf Bestätigung'
  waitlisted: 'Warteliste'
  waitlistedCaption: 'Warten auf einen Platz'
  team: 'Team'
  teamCaption: 'Leitung und Mitarbeitende'
country:
  free: '{n} frei'
  pending: '{n} ausstehend'
  waitlisted: '{n} auf Warteliste'
  team: '{n} im Team'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Inscriptions'
subtitle: 'Places, demandes en cours et équipe'
viewAll: 'Participants'
accepted: 'Participants confirmés'
capacityUnset: 'Aucune limite de participants'
free: '{n} places libres'
reserved: "{n} réservées pour la liste d'attente"
overbooked: '{n} en surréservation'
byCountry: 'Par pays'
kpi:
  pending: 'En attente'
  pendingCaption: 'En attente de confirmation'
  waitlisted: "Liste d'attente"
  waitlistedCaption: "En attente d'une place"
  team: 'Équipe'
  teamCaption: 'Responsables et équipe'
country:
  free: '{n} libres'
  pending: '{n} en attente'
  waitlisted: "{n} en liste d'attente"
  team: "{n} dans l'équipe"
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Rejestracje'
subtitle: 'Miejsca, oczekujące zgłoszenia i zespół'
viewAll: 'Uczestnicy'
accepted: 'Potwierdzeni uczestnicy'
capacityUnset: 'Nie ustawiono limitu uczestników'
free: 'Wolnych miejsc: {n}'
reserved: 'Zarezerwowane dla listy rezerwowej: {n}'
overbooked: 'Ponad limit: {n}'
byCountry: 'Według kraju'
kpi:
  pending: 'Oczekujący'
  pendingCaption: 'Oczekują na potwierdzenie'
  waitlisted: 'Lista rezerwowa'
  waitlistedCaption: 'Oczekują na miejsce'
  team: 'Zespół'
  teamCaption: 'Kadra i personel'
country:
  free: 'Wolne: {n}'
  pending: 'Oczekujący: {n}'
  waitlisted: 'Lista rezerwowa: {n}'
  team: 'Zespół: {n}'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Registrace'
subtitle: 'Místa, čekající žádosti a tým'
viewAll: 'Účastníci'
accepted: 'Potvrzení účastníci'
capacityUnset: 'Limit účastníků není nastaven'
free: 'Volných míst: {n}'
reserved: 'Rezervováno pro čekací listinu: {n}'
overbooked: 'Nad kapacitu: {n}'
byCountry: 'Podle země'
kpi:
  pending: 'Čekající'
  pendingCaption: 'Čeká na potvrzení'
  waitlisted: 'Čekací listina'
  waitlistedCaption: 'Čekají na místo'
  team: 'Tým'
  teamCaption: 'Vedoucí a personál'
country:
  free: 'Volná: {n}'
  pending: 'Čekající: {n}'
  waitlisted: 'Čekací listina: {n}'
  team: 'Tým: {n}'
</i18n>
