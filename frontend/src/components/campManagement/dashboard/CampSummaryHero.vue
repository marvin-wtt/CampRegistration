<template>
  <q-card
    flat
    bordered
    class="hero-card"
  >
    <q-card-section class="summary-header">
      <div class="summary-title-row">
        <div class="col">
          <div class="text-overline text-primary text-weight-bold">
            {{ t('campOverview') }}
          </div>
          <h1 class="camp-title text-h4 text-weight-bold q-my-none">
            {{ campName }}
          </h1>
        </div>

        <div class="status-chips">
          <q-chip
            v-if="countdown"
            outline
            color="primary"
            icon="schedule"
            :label="countdown"
            class="q-ma-none"
          />
          <q-chip
            :color="registrationStatus.color"
            text-color="white"
            :icon="registrationStatus.icon"
            :label="registrationStatus.label"
            class="q-ma-none"
          />
        </div>
      </div>

      <div class="camp-meta">
        <div class="meta-item">
          <q-icon name="calendar_month" />
          <span>{{ dateRange }}</span>
        </div>
        <div
          v-if="location"
          class="meta-item"
        >
          <q-icon name="location_on" />
          <span>{{ location }}</span>
        </div>
        <div class="meta-item">
          <q-icon name="cake" />
          <span>
            {{ t('ageRange', { min: camp?.minAge, max: camp?.maxAge }) }}
          </span>
        </div>
        <div
          v-if="countryNames"
          class="meta-item countries"
        >
          <q-icon name="public" />
          <span>{{ countryNames }}</span>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="capacity-section">
      <div class="capacity-copy">
        <div class="text-caption text-grey-7 text-weight-medium">
          {{ t('capacity') }}
        </div>
        <div class="row items-baseline q-gutter-xs">
          <span class="text-h5 text-weight-bold">{{ capacity.accepted }}</span>
          <template v-if="capacity.max != null">
            <span class="text-body1 text-grey-6">/ {{ capacity.max }}</span>
          </template>
          <span class="text-body2 text-grey-7">{{ t('confirmed') }}</span>
        </div>
      </div>

      <div
        v-if="capacity.max != null"
        class="capacity-progress"
      >
        <div class="row items-center justify-between q-mb-sm">
          <span class="text-body2 text-grey-7">
            {{ t('filled', { n: percent }) }}
          </span>
          <span
            class="text-body2 text-weight-bold"
            :class="`text-${barColor}`"
          >
            {{
              over > 0 ? t('over', { n: over }) : t('free', { n: freeDisplay })
            }}
          </span>
        </div>
        <q-linear-progress
          :value="ratio"
          :color="barColor"
          track-color="grey-5"
          rounded
          size="9px"
        />
      </div>
      <div
        v-else
        class="text-body2 text-grey-7"
      >
        {{ t('capacityUnset') }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useCampStatistics } from 'src/composables/campStatistics';
import { useObjectTranslation } from 'src/composables/objectTranslation';

const { t, d, locale } = useI18n();
const { to } = useObjectTranslation();
const campDetailsStore = useCampDetailsStore();
const stats = useCampStatistics();

const { data: camp } = storeToRefs(campDetailsStore);

const campName = computed(() => to(camp.value?.name));
const location = computed(() => to(camp.value?.location ?? undefined));
const countryNames = computed(() => {
  const countries = camp.value?.countries ?? [];
  try {
    const displayNames = new Intl.DisplayNames([locale.value], {
      type: 'region',
    });
    return countries
      .map((country) => displayNames.of(country.toUpperCase()) ?? country)
      .join(', ');
  } catch {
    return countries.map((country) => country.toUpperCase()).join(', ');
  }
});

const dateRange = computed(() => {
  if (!camp.value) {
    return '';
  }
  return `${d(new Date(camp.value.startAt), 'short')} – ${d(
    new Date(camp.value.endAt),
    'short',
  )}`;
});

const countdown = computed<string | undefined>(() => {
  if (!camp.value) {
    return undefined;
  }
  const days = daysFromNow(camp.value.startAt);
  if (days > 0) {
    return t('countdown.until', { days });
  }
  if (days === 0) {
    return t('countdown.today');
  }
  return daysFromNow(camp.value.endAt) >= 0
    ? t('countdown.running')
    : t('countdown.over');
});

const registrationStatus = computed(() => {
  const c = camp.value;
  if (!c || (!c.registrationOpensAt && !c.registrationClosesAt)) {
    return { label: t('registration.unset'), color: 'grey', icon: 'help' };
  }
  const now = new Date();
  const opensAt = c.registrationOpensAt
    ? new Date(c.registrationOpensAt)
    : null;
  const closesAt = c.registrationClosesAt
    ? new Date(c.registrationClosesAt)
    : null;

  if (opensAt && now < opensAt) {
    return {
      label: t('registration.upcoming'),
      color: 'blue',
      icon: 'schedule',
    };
  }
  if (closesAt && now > closesAt) {
    return { label: t('registration.closed'), color: 'grey-7', icon: 'lock' };
  }
  return {
    label: t('registration.open'),
    color: 'positive',
    icon: 'lock_open',
  };
});

const capacity = computed(() => ({
  accepted: stats.counts.value.accepted,
  max: stats.capacity.value.max,
  free: stats.capacity.value.free,
}));

const ratio = computed<number>(() => {
  const { accepted, max } = capacity.value;
  if (max == null || max === 0) {
    return 0;
  }
  return Math.min(1, accepted / max);
});

const percent = computed<number>(() => Math.round(ratio.value * 100));

const over = computed<number>(() => {
  const { accepted, max } = capacity.value;
  return max != null && accepted > max ? accepted - max : 0;
});

const freeDisplay = computed<number>(() => {
  const { free, max, accepted } = capacity.value;
  if (free != null) {
    return Math.max(0, free);
  }
  return max != null ? Math.max(0, max - accepted) : 0;
});

const barColor = computed<string>(() => {
  if (over.value > 0 || ratio.value >= 1) {
    return 'negative';
  }
  if (ratio.value >= 0.85) {
    return 'orange';
  }
  return 'primary';
});

function daysFromNow(date: string): number {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
</script>

<style scoped>
.hero-card {
  overflow: hidden;
  border-radius: 16px;
}

.summary-header,
.capacity-section {
  padding: 20px;
}

.summary-title-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.camp-title {
  line-height: 1.2;
}

.status-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.camp-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 24px;
  margin-top: 16px;
  color: rgba(75, 75, 75, 0.82);
}

.meta-item {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  font-size: 0.875rem;
}

.meta-item .q-icon {
  flex: 0 0 auto;
  color: var(--q-primary);
  font-size: 18px;
}

.capacity-section {
  display: grid;
  grid-template-columns: minmax(180px, 0.55fr) minmax(260px, 1.45fr);
  align-items: center;
  gap: 24px;
  background: rgba(127, 127, 127, 0.035);
}

:global(.body--dark) .camp-meta {
  color: rgba(255, 255, 255, 0.72);
}

@media (max-width: 599px) {
  .summary-header,
  .capacity-section {
    padding: 16px;
  }

  .summary-title-row {
    flex-direction: column;
  }

  .camp-title {
    font-size: 1.65rem;
  }

  .status-chips {
    justify-content: flex-start;
  }

  .capacity-section {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}
</style>

<i18n lang="yaml" locale="en">
confirmed: 'confirmed'
campOverview: 'Camp overview'
ageRange: 'Ages {min}–{max}'
capacity: 'Participant capacity'
capacityUnset: 'No participant limit configured'
filled: '{n}% filled'
free: '{n} places free'
over: '{n} over capacity'
countdown:
  until: '{days} days to go'
  today: 'Starts today'
  running: 'In progress'
  over: 'Finished'
registration:
  open: 'Registration open'
  closed: 'Registration closed'
  upcoming: 'Registration upcoming'
  unset: 'No registration dates'
</i18n>

<i18n lang="yaml" locale="de">
confirmed: 'bestätigt'
campOverview: 'Camp-Übersicht'
ageRange: 'Alter {min}–{max}'
capacity: 'Teilnehmendenkapazität'
capacityUnset: 'Kein Teilnehmendenlimit festgelegt'
filled: '{n}% belegt'
free: '{n} Plätze frei'
over: '{n} über Kapazität'
countdown:
  until: 'Noch {days} Tage'
  today: 'Beginnt heute'
  running: 'Läuft gerade'
  over: 'Beendet'
registration:
  open: 'Anmeldung offen'
  closed: 'Anmeldung geschlossen'
  upcoming: 'Anmeldung bevorstehend'
  unset: 'Keine Anmeldedaten'
</i18n>

<i18n lang="yaml" locale="fr">
confirmed: 'confirmés'
campOverview: 'Aperçu du camp'
ageRange: 'De {min} à {max} ans'
capacity: 'Capacité des participants'
capacityUnset: 'Aucune limite de participants'
filled: 'Rempli à {n}%'
free: '{n} places libres'
over: '{n} au-dessus de la capacité'
countdown:
  until: 'Encore {days} jours'
  today: "Commence aujourd'hui"
  running: 'En cours'
  over: 'Terminé'
registration:
  open: 'Inscription ouverte'
  closed: 'Inscription fermée'
  upcoming: 'Inscription à venir'
  unset: "Aucune date d'inscription"
</i18n>

<i18n lang="yaml" locale="pl">
confirmed: 'potwierdzonych'
campOverview: 'Przegląd obozu'
ageRange: 'Wiek {min}–{max}'
capacity: 'Limit uczestników'
capacityUnset: 'Nie ustawiono limitu uczestników'
filled: 'Zapełniono w {n}%'
free: 'Wolnych miejsc: {n}'
over: '{n} ponad limit'
countdown:
  until: 'Pozostało {days} dni'
  today: 'Zaczyna się dziś'
  running: 'W trakcie'
  over: 'Zakończono'
registration:
  open: 'Rejestracja otwarta'
  closed: 'Rejestracja zamknięta'
  upcoming: 'Rejestracja wkrótce'
  unset: 'Brak dat rejestracji'
</i18n>

<i18n lang="yaml" locale="cs">
confirmed: 'potvrzených'
campOverview: 'Přehled tábora'
ageRange: 'Věk {min}–{max}'
capacity: 'Kapacita účastníků'
capacityUnset: 'Limit účastníků není nastaven'
filled: 'Obsazeno z {n}%'
free: 'Volných míst: {n}'
over: '{n} nad kapacitu'
countdown:
  until: 'Zbývá {days} dní'
  today: 'Začíná dnes'
  running: 'Probíhá'
  over: 'Ukončeno'
registration:
  open: 'Registrace otevřena'
  closed: 'Registrace uzavřena'
  upcoming: 'Registrace již brzy'
  unset: 'Žádná data registrace'
</i18n>
