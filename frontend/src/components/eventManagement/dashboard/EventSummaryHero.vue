<template>
  <q-card
    flat
    bordered
    class="hero-card"
  >
    <div class="hero-accent" />
    <q-card-section class="hero-content">
      <div class="hero-main">
        <div class="status-chips">
          <span
            v-if="countdown"
            class="status-pill countdown-pill"
          >
            <q-icon
              name="schedule"
              size="17px"
            />
            {{ countdown }}
          </span>
          <span
            class="status-pill registration-pill"
            :class="`registration-${registrationStatus.tone}`"
          >
            <q-icon
              :name="registrationStatus.icon"
              size="17px"
            />
            {{ registrationStatus.label }}
          </span>
          <!-- Sharing stays offered outside the registration window — the event
               page is still reachable. The pill keeps its neutral look: the
               registration state is already spelled out by the pill next to it,
               and the unverified-organization case by the notice above the
               hero, so an alarm colour here would only read as a malfunction.
               The caveat rides along in the tooltip instead. -->
          <button
            v-if="event"
            type="button"
            class="status-pill copy-link-pill"
            @click="copyRegistrationLink"
          >
            <q-icon
              name="link"
              size="17px"
            />
            {{ t('copyLink.label') }}
            <q-tooltip class="copy-link-tooltip">
              <div>{{ t('copyLink.tooltip') }}</div>
              <div
                v-if="shareCaveat"
                class="copy-link-tooltip__caveat"
              >
                {{ shareCaveat }}
              </div>
            </q-tooltip>
          </button>
        </div>

        <div class="hero-copy">
          <div class="text-overline text-primary text-weight-bold">
            {{ t('eventOverview') }}
          </div>
          <h1 class="event-title text-h4 text-weight-bold q-my-none">
            {{ eventName }}
          </h1>
          <div class="event-meta">
            <q-chip
              v-if="event?.organizationName"
              outline
              icon="apartment"
              :label="event.organizationName"
              class="meta-chip"
            >
              <q-tooltip>{{ t('organization') }}</q-tooltip>
            </q-chip>
            <q-chip
              outline
              icon="calendar_month"
              :label="dateRange"
              class="meta-chip"
            />
            <q-chip
              v-if="location"
              outline
              icon="location_on"
              :label="location"
              class="meta-chip"
            />
            <q-chip
              outline
              icon="cake"
              :label="t('ageRange', { min: event?.minAge, max: event?.maxAge })"
              class="meta-chip"
            />
            <q-chip
              v-if="countryNames"
              outline
              icon="public"
              :label="countryNames"
              class="meta-chip"
            >
              <q-tooltip>{{ countryNames }}</q-tooltip>
            </q-chip>
          </div>
        </div>
      </div>

      <aside class="capacity-panel">
        <div class="capacity-heading">
          <div>
            <div class="capacity-label">{{ t('capacity') }}</div>
            <div class="capacity-value">
              <span>{{ capacity.accepted }}</span>
              <span
                v-if="capacity.max != null"
                class="capacity-max"
              >
                / {{ capacity.max }}
              </span>
            </div>
          </div>
          <div
            v-if="capacity.max != null"
            class="capacity-percent"
            :class="`text-${barColor}`"
          >
            {{ percent }}%
          </div>
        </div>

        <template v-if="capacity.max != null">
          <q-linear-progress
            :value="ratio"
            :color="barColor"
            track-color="grey-5"
            rounded
            size="10px"
            class="capacity-bar"
          />
          <div class="capacity-footer">
            <span>{{ t('confirmed') }}</span>
            <span
              class="text-weight-bold"
              :class="`text-${barColor}`"
            >
              {{
                over > 0
                  ? t('over', { n: over })
                  : t('free', { n: freeDisplay })
              }}
            </span>
          </div>
        </template>
        <div
          v-else
          class="capacity-footer"
        >
          <span>{{ t('confirmed') }}</span>
          <span>{{ t('capacityUnset') }}</span>
        </div>
      </aside>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { copyToClipboard, useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useEventStatistics } from '@/composables/eventStatistics';
import { useObjectTranslation } from '@/composables/objectTranslation';

const { t, d, locale } = useI18n();
const { to } = useObjectTranslation();
const router = useRouter();
const quasar = useQuasar();
const eventDetailsStore = useEventDetailsStore();
const stats = useEventStatistics();

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
  const startAt = new Date(event.value.startAt).getTime();
  const endAt = new Date(event.value.endAt).getTime();

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
/*
 * Styling relies on the MD3 design tokens exposed by
 * @anoyomoose/q2-fresh-paint-md3e (--md3-*). These switch automatically
 * between light and dark, so no manual dark-mode overrides are needed.
 */
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
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.75fr);
  gap: 24px;
  align-items: stretch;
  padding: 24px;
}

.hero-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
}

.event-title {
  max-width: 900px;
  line-height: 1.2;
  letter-spacing: -0.025em;
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
  min-height: 32px;
  padding: 5px 12px;
  font-size: 0.78rem;
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

.copy-link-pill {
  color: var(--md3-on-secondary-container);
  background: var(--md3-secondary-container);
  border: none;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.copy-link-pill:hover,
.copy-link-pill:focus-visible {
  box-shadow: 0 2px 8px rgba(38, 50, 56, 0.16);
  outline: none;
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
  gap: 8px;
  margin-top: 18px;
}

.meta-chip {
  margin: 0;
  max-width: 100%;
  background: var(--md3-surface-container-high);
}

.meta-chip :deep(.q-chip__icon) {
  color: var(--md3-primary);
}

.capacity-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
  background: color-mix(in srgb, var(--md3-primary) 7%, var(--md3-surface));
  border: 1px solid color-mix(in srgb, var(--md3-primary) 22%, transparent);
  border-radius: 12px;
}

.capacity-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.capacity-label {
  margin-bottom: 3px;
  color: var(--md3-on-surface-variant);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.capacity-value {
  color: var(--md3-on-surface);
  font-size: 2.2rem;
  font-weight: 750;
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.capacity-max {
  color: var(--md3-on-surface-variant);
  font-size: 1.2rem;
  font-weight: 500;
}

.capacity-percent {
  font-size: 1.1rem;
  font-weight: 700;
}

.capacity-bar {
  margin-top: 22px;
}

.capacity-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  color: var(--md3-on-surface-variant);
  font-size: 0.8rem;
}

@media (max-width: 899px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 599px) {
  .hero-content {
    gap: 18px;
    padding: 18px;
  }

  .status-chips {
    gap: 6px;
  }

  .status-pill {
    min-height: 28px;
    padding: 3px 10px;
    font-size: 0.72rem;
  }

  .status-pill :deep(.q-icon) {
    font-size: 15px !important;
  }

  .event-title {
    font-size: 1.6rem;
  }

  .hero-main {
    gap: 16px;
  }

  .event-meta {
    margin-top: 4px;
  }

  .capacity-panel {
    padding: 16px;
  }

  .capacity-value {
    font-size: 2rem;
  }

  .capacity-bar {
    margin-top: 16px;
  }
}
</style>

<i18n lang="yaml" locale="en">
confirmed: 'confirmed'
eventOverview: 'Event overview'
organization: 'Owning organization'
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
confirmed: 'bestätigt'
eventOverview: 'Veranstaltungsübersicht'
organization: 'Besitzende Organisation'
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
confirmed: 'confirmés'
eventOverview: "Aperçu de l'événement"

organization: 'Organisation propriétaire'
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
confirmed: 'potwierdzonych'
eventOverview: 'Przegląd wydarzenia'
organization: 'Organizacja właścicielska'
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
confirmed: 'potvrzených'
eventOverview: 'Přehled akce'
organization: 'Vlastnící organizace'
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
