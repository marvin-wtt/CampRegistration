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
          <span
            v-if="viewedPhase"
            class="phase-group"
          >
            <button
              type="button"
              class="status-pill phase-pill"
              :class="{ 'phase-pill--preview': previewing }"
              :aria-label="t('phase.switch')"
              data-test="dashboard-phase"
            >
              <q-icon
                :name="previewing ? 'visibility' : PHASE_ICONS[viewedPhase]"
                size="16px"
              />
              {{
                previewing
                  ? t('phase.preview', { phase: t(`phase.${viewedPhase}`) })
                  : t(`phase.${viewedPhase}`)
              }}
              <q-icon
                name="arrow_drop_down"
                size="18px"
              />
              <q-menu
                anchor="bottom left"
                self="top left"
                class="rounded-md"
              >
                <q-list class="phase-menu">
                  <q-item-label header>{{ t('phase.switch') }}</q-item-label>
                  <q-item
                    v-for="phase in EVENT_PHASES"
                    :key="phase"
                    v-close-popup
                    clickable
                    @click="viewedPhase = phase"
                  >
                    <q-item-section avatar>
                      <q-icon :name="PHASE_ICONS[phase]" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ t(`phase.${phase}`) }}</q-item-label>
                      <q-item-label
                        v-if="phase === actualPhase"
                        caption
                      >
                        {{ t('phase.current') }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section
                      v-if="phase === viewedPhase"
                      side
                    >
                      <q-icon
                        name="check"
                        color="primary"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </button>
            <m-btn
              v-if="previewing"
              :aria-label="t('phase.back')"
              icon="close"
              size="sm"
              round
              flat
              dense
              color="primary"
              data-test="dashboard-phase-back"
              @click="viewedPhase = actualPhase"
            >
              <q-tooltip>{{ t('phase.back') }}</q-tooltip>
            </m-btn>
          </span>
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

      <!-- Sharing stays offered outside the registration window, as the event
           page is still reachable. The caveat rides along in the tooltip. -->
      <m-btn
        :label="t('copyLink.label')"
        :disable="!event"
        icon="link"
        class="copy-link-btn"
        primary
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
import { useRouter } from 'vue-router';
import { copyToClipboard, useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import EventAvatar from '@/components/event/EventAvatar.vue';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import {
  EVENT_PHASES,
  eventDayOf,
  type EventPhase,
  useEventPhase,
} from '@/composables/eventPhase';
import { daysBetweenDates, formatLocalDate } from '@/utils/date';

// While `loading` everything derived from the event is skeletonized. Quick
// actions come in through the `actions` slot.
const { loading = false } = defineProps<{
  loading?: boolean;
}>();

const PHASE_ICONS: Record<EventPhase, string> = {
  setup: 'construction',
  registration: 'how_to_reg',
  preparation: 'inventory_2',
  running: 'play_circle',
  wrapUp: 'flag',
};

const { t, d } = useI18n();
const { to } = useObjectTranslation();
const router = useRouter();
const quasar = useQuasar();
const eventDetailsStore = useEventDetailsStore();
const { actualPhase, viewedPhase, previewing } = useEventPhase();

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
</script>

<style scoped>
.phase-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

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

.phase-pill {
  padding-right: 4px;
  color: var(--md3-on-primary);
  cursor: pointer;
  background: var(--md3-primary);
}

.phase-pill--preview {
  color: var(--md3-on-tertiary-container);
  background: var(--md3-tertiary-container);
}

.phase-pill:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

.phase-menu {
  min-width: 220px;
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

.copy-link-tooltip {
  max-width: 260px;
}

.copy-link-tooltip__caveat {
  margin-top: 4px;
  opacity: 0.8;
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
phase:
  setup: 'Setup'
  registration: 'Registration'
  preparation: 'Preparation'
  running: 'Running'
  wrapUp: 'Wrap-up'
  switch: 'View dashboard for phase'
  current: 'Current phase'
  preview: 'Preview: {phase}'
  back: 'Back to current phase'
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
phase:
  setup: 'Einrichtung'
  registration: 'Anmeldung'
  preparation: 'Vorbereitung'
  running: 'Läuft'
  wrapUp: 'Nachbereitung'
  switch: 'Übersicht für Phase anzeigen'
  current: 'Aktuelle Phase'
  preview: 'Vorschau: {phase}'
  back: 'Zurück zur aktuellen Phase'
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
phase:
  setup: 'Configuration'
  registration: 'Inscriptions'
  preparation: 'Préparation'
  running: 'En cours'
  wrapUp: 'Clôture'
  switch: 'Afficher le tableau de bord pour la phase'
  current: 'Phase actuelle'
  preview: 'Aperçu : {phase}'
  back: 'Revenir à la phase actuelle'
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
phase:
  setup: 'Konfiguracja'
  registration: 'Rejestracja'
  preparation: 'Przygotowanie'
  running: 'W trakcie'
  wrapUp: 'Podsumowanie'
  switch: 'Pokaż pulpit dla fazy'
  current: 'Bieżąca faza'
  preview: 'Podgląd: {phase}'
  back: 'Wróć do bieżącej fazy'
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
phase:
  setup: 'Nastavení'
  registration: 'Registrace'
  preparation: 'Příprava'
  running: 'Probíhá'
  wrapUp: 'Uzavření'
  switch: 'Zobrazit přehled pro fázi'
  current: 'Aktuální fáze'
  preview: 'Náhled: {phase}'
  back: 'Zpět na aktuální fázi'
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
