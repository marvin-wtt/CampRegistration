<template>
  <q-card
    flat
    bordered
    class="header-card"
  >
    <div class="header-accent" />
    <q-card-section class="header-content">
      <q-skeleton
        v-if="loading || !event"
        type="rect"
        class="header-avatar header-avatar-skeleton"
      />
      <event-avatar
        v-else
        :event-id="event.id"
        :name="eventName"
        :logo="event.logo"
        :size="quasar.screen.lt.sm ? 40 : 48"
        class="header-avatar"
      />

      <div class="header-text">
        <q-skeleton
          v-if="loading"
          type="text"
          width="45%"
          class="event-title"
        />
        <h1
          v-else
          class="event-title"
        >
          {{ eventName }}
        </h1>

        <div
          v-if="loading"
          class="status-row"
        >
          <q-skeleton
            v-for="width in ['112px', '96px', '180px']"
            :key="width"
            type="rect"
            :width="width"
            class="status-pill-skeleton"
          />
        </div>
        <div
          v-else
          class="status-row"
        >
          <dashboard-phase-switcher />
          <span
            v-if="timing"
            class="status-pill timing-pill"
          >
            <q-icon
              name="schedule"
              size="16px"
            />
            {{ timing }}
          </span>
          <span
            v-if="showRegistrationStatus"
            class="status-pill"
            :class="`registration-${registrationStatus.tone}`"
          >
            <q-icon
              :name="registrationStatus.icon"
              size="16px"
            />
            {{ registrationStatus.label }}
          </span>
        </div>

        <div
          v-if="loading"
          class="event-meta"
        >
          <q-skeleton
            v-for="width in ['132px', '176px', '96px']"
            :key="width"
            type="text"
            :width="width"
          />
        </div>
        <ul
          v-else
          class="event-meta"
        >
          <li class="meta-item">
            <q-icon name="calendar_month" />
            <span>{{ dateRange }}</span>
          </li>
          <li
            v-if="location"
            class="meta-item"
          >
            <q-icon name="location_on" />
            <span>{{ location }}</span>
          </li>
          <li class="meta-item">
            <q-icon name="cake" />
            <span>
              {{ t('ageRange', { min: event?.minAge, max: event?.maxAge }) }}
            </span>
          </li>
          <li
            v-if="event?.organizationName"
            class="meta-item"
          >
            <q-icon name="apartment" />
            <span>{{ event.organizationName }}</span>
            <q-tooltip>{{ t('organization') }}</q-tooltip>
          </li>
        </ul>
      </div>

      <copy-event-link-button
        :event
        class="copy-link-btn"
      />
    </q-card-section>

    <!-- Phones have no navigation rail, so the shortcuts stand in for it. -->
    <q-card-section
      v-if="$slots.actions"
      class="header-shortcuts"
    >
      <slot name="actions" />
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import EventAvatar from '@/components/event/EventAvatar.vue';
import DashboardPhaseSwitcher from '@/components/event/dashboard/DashboardPhaseSwitcher.vue';
import CopyEventLinkButton from '@/components/event/dashboard/CopyEventLinkButton.vue';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { eventDayOf, useEventPhase } from '@/composables/eventPhase';
import { daysBetweenDates, formatLocalDate } from '@/utils/date';

// While `loading` everything derived from the event is skeletonized. Quick
// actions come in through the `actions` slot.
const { loading = false } = defineProps<{
  loading?: boolean;
}>();

const { t, d } = useI18n();
const { to } = useObjectTranslation();
const quasar = useQuasar();
const eventDetailsStore = useEventDetailsStore();
const { actualPhase } = useEventPhase();

const { data: event } = storeToRefs(eventDetailsStore);

const eventName = computed(() => to(event.value?.name));
const location = computed(() => to(event.value?.location ?? undefined));

const dateRange = computed(() => {
  if (!event.value) {
    return '';
  }
  return `${d(new Date(event.value.startAt), 'short')} – ${d(
    new Date(event.value.endAt),
    'short',
  )}`;
});

// Describes the event as it actually is, also while another phase is previewed.
const timing = computed<string | undefined>(() => {
  if (!event.value) {
    return undefined;
  }
  const today = formatLocalDate(new Date());

  switch (actualPhase.value) {
    case 'running':
      return t('timing.day', eventDayOf(event.value, today));
    case 'wrapUp':
      return t('timing.over');
    default: {
      const days = daysBetweenDates(new Date(), new Date(event.value.startAt));
      return days <= 0 ? t('timing.today') : t('timing.until', { days });
    }
  }
});

const registrationStatus = computed(() => {
  const c = event.value;
  if (!c || (!c.registrationOpensAt && !c.registrationClosesAt)) {
    return {
      label: t('registration.unset'),
      tone: 'neutral',
      icon: 'help',
    };
  }

  if (c.registrationStatus === 'upcoming') {
    return {
      label: t('registration.upcoming'),
      tone: 'info',
      icon: 'schedule',
    };
  }
  if (c.registrationStatus === 'closed') {
    return {
      label: t('registration.closed'),
      tone: 'neutral',
      icon: 'lock',
    };
  }

  return {
    label: t('registration.open'),
    tone: 'positive',
    icon: 'lock_open',
  };
});

// Once the event runs, a closed registration is a given; one still open is news.
const showRegistrationStatus = computed<boolean>(
  () =>
    (actualPhase.value !== 'running' && actualPhase.value !== 'wrapUp') ||
    event.value?.registrationStatus === 'open',
);
</script>

<style scoped>
.header-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
}

.header-accent {
  position: absolute;
  inset: 0 0 auto;
  z-index: 1;
  height: 4px;
  background: linear-gradient(90deg, var(--md3-primary), var(--md3-tertiary));
}

.header-content {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px;
  padding: 20px 24px 16px;
}

.header-avatar-skeleton {
  width: 48px;
  height: 48px;
  border-radius: 13px;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.event-title {
  margin: 0;
  color: var(--md3-on-surface);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  padding: 3px 10px;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  border: none;
  border-radius: 999px;
}

.timing-pill {
  color: var(--md3-on-primary-container);
  background: var(--md3-primary-container);
}

.registration-positive {
  color: var(--md3-on-positive-container);
  background: var(--md3-positive-container);
}

.registration-info {
  color: var(--md3-on-info-container);
  background: var(--md3-info-container);
}

.registration-neutral {
  color: var(--md3-on-surface-variant);
  background: var(--md3-surface-container-highest);
}

.status-pill-skeleton {
  height: 26px;
  border-radius: 999px;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
}

.meta-item .q-icon {
  flex: 0 0 auto;
  color: var(--md3-primary);
  font-size: 16px;
}

.meta-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-shortcuts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 12px 16px 16px;
  background: var(--md3-surface-container-low);
  border-top: 1px solid var(--md3-outline-variant);
}

@media (max-width: 599px) {
  .header-content {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    padding: 16px;
  }

  .header-avatar-skeleton {
    width: 40px;
    height: 40px;
    border-radius: 11px;
  }

  .event-title {
    font-size: 1.25rem;
  }

  .copy-link-btn {
    grid-column: 1 / -1;
  }
}
</style>

<i18n lang="yaml" locale="en">
organization: 'Owning organization'
ageRange: 'Ages {min}–{max}'
timing:
  until: '{days} days to go'
  today: 'Starts today'
  day: 'Day {day} of {days}'
  over: 'Finished'
registration:
  open: 'Registration open'
  closed: 'Registration closed'
  upcoming: 'Registration upcoming'
  unset: 'No registration dates'
</i18n>

<i18n lang="yaml" locale="de">
organization: 'Besitzende Organisation'
ageRange: 'Alter {min}–{max}'
timing:
  until: 'Noch {days} Tage'
  today: 'Beginnt heute'
  day: 'Tag {day} von {days}'
  over: 'Beendet'
registration:
  open: 'Anmeldung offen'
  closed: 'Anmeldung geschlossen'
  upcoming: 'Anmeldung bevorstehend'
  unset: 'Keine Anmeldedaten'
</i18n>

<i18n lang="yaml" locale="fr">
organization: 'Organisation propriétaire'
ageRange: 'De {min} à {max} ans'
timing:
  until: 'Encore {days} jours'
  today: "Commence aujourd'hui"
  day: 'Jour {day} sur {days}'
  over: 'Terminé'
registration:
  open: 'Inscription ouverte'
  closed: 'Inscription fermée'
  upcoming: 'Inscription à venir'
  unset: "Aucune date d'inscription"
</i18n>

<i18n lang="yaml" locale="pl">
organization: 'Organizacja właścicielska'
ageRange: 'Wiek {min}–{max}'
timing:
  until: 'Pozostało {days} dni'
  today: 'Zaczyna się dziś'
  day: 'Dzień {day} z {days}'
  over: 'Zakończono'
registration:
  open: 'Rejestracja otwarta'
  closed: 'Rejestracja zamknięta'
  upcoming: 'Rejestracja wkrótce'
  unset: 'Brak dat rejestracji'
</i18n>

<i18n lang="yaml" locale="cs">
organization: 'Vlastnící organizace'
ageRange: 'Věk {min}–{max}'
timing:
  until: 'Zbývá {days} dní'
  today: 'Začíná dnes'
  day: 'Den {day} z {days}'
  over: 'Ukončeno'
registration:
  open: 'Registrace otevřena'
  closed: 'Registrace uzavřena'
  upcoming: 'Registrace již brzy'
  unset: 'Žádná data registrace'
</i18n>
