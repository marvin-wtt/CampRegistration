<template>
  <q-card
    flat
    bordered
    class="hero-card"
  >
    <div class="hero-accent" />
    <q-card-section class="hero-content">
      <div
        v-if="loading"
        class="status-chips"
      >
        <q-skeleton
          v-for="width in ['96px', '148px']"
          :key="width"
          type="rect"
          :width="width"
          class="status-pill-skeleton"
        />
      </div>
      <div
        v-else
        class="status-chips"
      >
        <span
          v-if="countdown"
          class="status-pill countdown-pill"
        >
          <q-icon
            name="schedule"
            size="16px"
          />
          {{ countdown }}
        </span>
        <span
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

      <div class="hero-title-row">
        <q-skeleton
          v-if="loading"
          type="text"
          width="55%"
          class="event-title"
        />
        <h1
          v-else
          class="event-title"
        >
          {{ eventName }}
        </h1>
        <!-- Sharing stays offered outside the registration window — the event
             page is still reachable. The caveat rides along in the tooltip. -->
        <m-btn
          v-if="event"
          :label="t('copyLink.label')"
          icon="link"
          class="copy-link-btn"
          primary
          tonal
          no-caps
          @click="copyRegistrationLink"
        >
          <q-tooltip class="copy-link-tooltip">
            <div>{{ t('copyLink.tooltip') }}</div>
            <div
              v-if="shareCaveat"
              class="copy-link-tooltip__caveat"
            >
              {{ shareCaveat }}
            </div>
          </q-tooltip>
        </m-btn>
      </div>

      <div
        v-if="loading"
        class="event-meta"
      >
        <q-skeleton
          v-for="width in ['132px', '176px', '112px', '96px']"
          :key="width"
          type="text"
          :width="width"
        />
      </div>
      <ul
        v-else
        class="event-meta"
      >
        <li
          v-if="event?.organizationName"
          class="meta-item"
        >
          <q-icon name="apartment" />
          <span>{{ event.organizationName }}</span>
          <q-tooltip>{{ t('organization') }}</q-tooltip>
        </li>
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
          v-if="countryNames"
          class="meta-item"
        >
          <q-icon name="public" />
          <span>{{ countryNames }}</span>
        </li>
      </ul>
    </q-card-section>

    <template v-if="$slots.actions">
      <q-separator />
      <q-card-section class="hero-actions">
        <slot name="actions" />
      </q-card-section>
    </template>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { copyToClipboard, useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { zonedInstant } from '@camp-registration/common/utils';

// While `loading` everything derived from the event is skeletonized. Quick
// actions come in through the `actions` slot.
const { loading = false } = defineProps<{
  loading?: boolean;
}>();

const { t, d, locale } = useI18n();
const { to } = useObjectTranslation();
const router = useRouter();
const quasar = useQuasar();
const eventDetailsStore = useEventDetailsStore();

const { data: event } = storeToRefs(eventDetailsStore);

const eventName = computed(() => to(event.value?.name));
const location = computed(() => to(event.value?.location ?? undefined));
const countryNames = computed(() => {
  const countries = event.value?.countries ?? [];
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
  if (!event.value) {
    return '';
  }
  return `${d(new Date(event.value.startAt), 'short')} – ${d(
    new Date(event.value.endAt),
    'short',
  )}`;
});

const countdown = computed<string | undefined>(() => {
  if (!event.value) {
    return undefined;
  }
  const now = Date.now();
  const startAt = zonedInstant(
    event.value.startAt,
    event.value.timezone,
  ).getTime();
  const endAt = zonedInstant(event.value.endAt, event.value.timezone).getTime();

  // The event has already started: it is either in progress or over.
  if (now >= startAt) {
    return now <= endAt ? t('countdown.running') : t('countdown.over');
  }

  // The event is still upcoming: count the calendar days until it starts.
  const days = daysFromNow(event.value.startAt);

  return days <= 0 ? t('countdown.today') : t('countdown.until', { days });
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

// The event page stays reachable outside the registration window, so the link is
// still worth sending — it just can't be signed up through. While the
// organization is unverified the page 403s for everyone but its managers, which
// is the one case where the link is of no use at all.
const shareCaveat = computed<string | null>(() => {
  const c = event.value;
  if (!c) {
    return null;
  }

  if (c.organizationVerificationStatus !== 'VERIFIED') {
    return t('copyLink.caveat.unverified', {
      organization: c.organizationName,
    });
  }

  switch (c.registrationStatus) {
    case 'upcoming':
      return t('copyLink.caveat.upcoming');
    case 'closed':
      return t('copyLink.caveat.closed');
    default:
      return null;
  }
});

async function copyRegistrationLink() {
  const eventId = event.value?.id;
  if (!eventId) {
    return;
  }

  const url =
    window.location.origin +
    router.resolve({ name: 'event', params: { eventId } }).href;

  try {
    await copyToClipboard(url);
    // The copy itself succeeded either way — the caveat is context, not a
    // failure, so it rides along as a caption rather than flipping the tone.
    const showShareCaveat = shareCaveat.value != null;

    quasar.notify({
      type: showShareCaveat ? 'warning' : 'positive',
      message: t('copyLink.success'),
      caption: showShareCaveat ? shareCaveat.value : '',
      icon: 'assignment_turned_in',
    });
  } catch {
    quasar.notify({
      type: 'negative',
      message: t('copyLink.fail'),
    });
  }
}

function daysFromNow(date: string): number {
  const target = new Date(date);
  const now = new Date();
  // Compare calendar days, ignoring the time of day, so a event starting later
  // today resolves to 0 rather than rounding up to a full day.
  const startOfTarget = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const startOfToday = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  return Math.round((startOfTarget - startOfToday) / (1000 * 60 * 60 * 24));
}
</script>

<style scoped>
.hero-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
}

.hero-accent {
  position: absolute;
  inset: 0 0 auto;
  z-index: 1;
  height: 4px;
  background: linear-gradient(90deg, var(--md3-primary), var(--md3-tertiary));
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 24px 20px;
}

.status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 4px 12px;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 999px;
}

.countdown-pill {
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
  height: 28px;
  border-radius: 999px;
}

.hero-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
}

.event-title {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  color: var(--md3-on-surface);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}

.copy-link-btn {
  flex: 0 0 auto;
}

.copy-link-tooltip {
  max-width: 260px;
}

.copy-link-tooltip__caveat {
  margin-top: 4px;
  opacity: 0.8;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
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
  font-size: 0.875rem;
}

.meta-item .q-icon {
  flex: 0 0 auto;
  color: var(--md3-primary);
  font-size: 18px;
}

.meta-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 24px;
  background: var(--md3-surface-container-low);
}

@media (max-width: 599px) {
  .hero-content {
    gap: 10px;
    padding: 20px 16px 16px;
  }

  .event-title {
    font-size: 1.5rem;
  }

  .copy-link-btn {
    width: 100%;
  }

  .event-meta {
    flex-direction: column;
    gap: 6px;
  }

  .hero-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 12px 16px;
  }
}
</style>

<i18n lang="yaml" locale="en">
organization: 'Owning organization'
ageRange: 'Ages {min}–{max}'
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
copyLink:
  label: 'Copy link'
  tooltip: 'Copy the public registration form link'
  success: 'Link copied to clipboard'
  fail: 'Failed to copy link to clipboard'
  caveat:
    closed: 'Registration is closed — visitors can view the event but cannot sign up.'
    upcoming: 'Registration has not opened yet — visitors can view the event but cannot sign up yet.'
    unverified: 'Only this event’s managers can open the link while {organization} is unverified.'
</i18n>

<i18n lang="yaml" locale="de">
organization: 'Besitzende Organisation'
ageRange: 'Alter {min}–{max}'
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
copyLink:
  label: 'Link kopieren'
  tooltip: 'Link zum öffentlichen Anmeldeformular kopieren'
  success: 'Link in die Zwischenablage kopiert'
  fail: 'Link konnte nicht kopiert werden'
  caveat:
    closed: 'Die Anmeldung ist geschlossen — Besucher sehen die Veranstaltung, können sich aber nicht anmelden.'
    upcoming: 'Die Anmeldung ist noch nicht geöffnet — Besucher sehen die Veranstaltung, können sich aber noch nicht anmelden.'
    unverified: 'Solange {organization} nicht verifiziert ist, können nur die Verantwortlichen dieser Veranstaltung den Link öffnen.'
</i18n>

<i18n lang="yaml" locale="fr">
organization: 'Organisation propriétaire'
ageRange: 'De {min} à {max} ans'
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
copyLink:
  label: 'Copier le lien'
  tooltip: "Copier le lien du formulaire d'inscription public"
  success: 'Lien copié dans le presse-papiers'
  fail: 'Échec de la copie du lien'
  caveat:
    closed: "Les inscriptions sont fermées — les visiteurs peuvent voir l'événement mais pas s’inscrire."

    upcoming: "Les inscriptions ne sont pas encore ouvertes — les visiteurs peuvent voir l'événement mais pas encore s’inscrire."

    unverified: 'Tant que {organization} n’est pas vérifiée, seuls les responsables de cet événement peuvent ouvrir le lien.'
</i18n>

<i18n lang="yaml" locale="pl">
organization: 'Organizacja właścicielska'
ageRange: 'Wiek {min}–{max}'
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
copyLink:
  label: 'Kopiuj link'
  tooltip: 'Skopiuj link do publicznego formularza rejestracji'
  success: 'Link skopiowany do schowka'
  fail: 'Nie udało się skopiować linku'
  caveat:
    closed: 'Rejestracja jest zamknięta — odwiedzający zobaczą wydarzenie, ale nie mogą się zapisać.'
    upcoming: 'Rejestracja jeszcze się nie rozpoczęła — odwiedzający zobaczą wydarzenie, ale nie mogą się jeszcze zapisać.'
    unverified: 'Dopóki {organization} nie zostanie zweryfikowana, link mogą otworzyć tylko osoby zarządzające tym wydarzeniem.'
</i18n>

<i18n lang="yaml" locale="cs">
organization: 'Vlastnící organizace'
ageRange: 'Věk {min}–{max}'
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
copyLink:
  label: 'Kopírovat odkaz'
  tooltip: 'Zkopírovat odkaz na veřejný registrační formulář'
  success: 'Odkaz zkopírován do schránky'
  fail: 'Odkaz se nepodařilo zkopírovat'
  caveat:
    closed: 'Registrace je uzavřena — návštěvníci akci uvidí, ale nemohou se přihlásit.'
    upcoming: 'Registrace ještě nezačala — návštěvníci akci uvidí, ale zatím se nemohou přihlásit.'
    unverified: 'Dokud není {organization} ověřena, může odkaz otevřít pouze správa této akce.'
</i18n>
