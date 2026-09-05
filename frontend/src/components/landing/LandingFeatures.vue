<template>
  <section
    class="features"
    aria-labelledby="landing-features-title"
  >
    <header class="features__header">
      <span class="features__eyebrow">{{ t('eyebrow') }}</span>
      <h2
        id="landing-features-title"
        class="features__title"
      >
        {{ t('title') }}
      </h2>
      <p class="features__subtitle">{{ t('subtitle') }}</p>
    </header>

    <div
      class="features__filter"
      role="group"
      :aria-label="t('filter_label')"
    >
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        class="filter-pill"
        :class="{ 'filter-pill--active': category === option.value }"
        :aria-pressed="category === option.value"
        :data-test="`landing-filter-${option.value}`"
        @click="category = option.value"
      >
        {{ option.label }}
        <span class="filter-pill__count">{{ option.count }}</span>
      </button>
    </div>

    <ul class="features__grid">
      <li
        v-for="feature in visibleFeatures"
        :key="feature.id"
        class="features__cell"
        :class="{ 'features__cell--wide': feature.featured && showBento }"
      >
        <button
          type="button"
          class="feature-card"
          :class="{ 'feature-card--featured': feature.featured }"
          :data-test="`landing-feature-${feature.id}`"
          @click="openFeature(feature.id)"
        >
          <span class="feature-card__icon">
            <q-icon
              :name="feature.icon"
              size="26px"
            />
          </span>
          <span class="feature-card__title">{{ feature.title }}</span>
          <span class="feature-card__text">{{ feature.text }}</span>
          <span class="feature-card__more">
            {{ t('card_action') }}
            <q-icon
              name="arrow_forward"
              size="16px"
            />
          </span>
        </button>
      </li>
    </ul>

    <div class="features__extras">
      <span class="features__extras-label">{{ t('extras_label') }}</span>
      <span
        v-for="extra in EXTRA_CHIPS"
        :key="extra.name"
        class="features__chip"
      >
        <q-icon
          :name="extra.icon"
          size="15px"
        />
        {{ t(`extra.${extra.name}`) }}
      </span>
    </div>

    <feature-detail-dialog
      v-model="detailOpen"
      :feature="activeFeature"
      :index="activeIndex"
      :total="visibleFeatures.length"
      @prev="step(-1)"
      @next="step(1)"
      @closed="activeId = undefined"
    />
  </section>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import FeatureDetailDialog from './FeatureDetailDialog.vue';
import {
  FEATURE_CATEGORIES,
  LANDING_FEATURES,
  type FeatureCategory,
  type ResolvedFeature,
} from './landing-features';

const { t } = useI18n();

type Filter = FeatureCategory | 'all';

const category = ref<Filter>('all');
const activeId = ref<string>();
const detailOpen = ref(false);

const EXTRA_CHIPS = [
  { name: 'realtime', icon: 'bolt' },
  { name: 'languages', icon: 'translate' },
  { name: 'multilingual_forms', icon: 'language' },
  { name: 'mobile', icon: 'devices' },
  { name: 'waitlist', icon: 'hourglass_top' },
  { name: 'limits', icon: 'tune' },
  { name: 'window', icon: 'schedule' },
  { name: 'print', icon: 'print' },
  { name: 'navigation', icon: 'visibility_off' },
  { name: 'two_factor', icon: 'phonelink_lock' },
  { name: 'dark_mode', icon: 'dark_mode' },
  { name: 'self_host', icon: 'dns' },
] as const;

const resolvedFeatures = computed<ResolvedFeature[]>(() =>
  LANDING_FEATURES.map((feature) => ({
    id: feature.id,
    icon: feature.icon,
    preview: feature.preview,
    featured: feature.featured ?? false,
    category: t(`category.${feature.category}`),
    title: t(`feature.${feature.id}.title`),
    text: t(`feature.${feature.id}.text`),
    detail: t(`feature.${feature.id}.detail`),
    points: Array.from({ length: feature.points }, (_, i) =>
      t(`feature.${feature.id}.point.${i + 1}`),
    ),
  })),
);

const visibleFeatures = computed(() => {
  if (category.value === 'all') {
    return resolvedFeatures.value;
  }
  const ids = new Set(
    LANDING_FEATURES.filter((f) => f.category === category.value).map(
      (f) => f.id,
    ),
  );
  return resolvedFeatures.value.filter((f) => ids.has(f.id));
});

const filterOptions = computed<
  { value: Filter; label: string; count: number }[]
>(() => [
  {
    value: 'all',
    label: t('category.all'),
    count: LANDING_FEATURES.length,
  },
  ...FEATURE_CATEGORIES.map((value) => ({
    value,
    label: t(`category.${value}`),
    count: LANDING_FEATURES.filter((f) => f.category === value).length,
  })),
]);

/*
 * The four featured cards take a wider cell only in the unfiltered view, where
 * they sit first and tile into full rows. Under a filter the counts no longer
 * line up and a wide cell would punch a hole in the middle of a row.
 */
const showBento = computed(() => category.value === 'all');

const activeIndex = computed(() =>
  visibleFeatures.value.findIndex((f) => f.id === activeId.value),
);

const activeFeature = computed(() =>
  activeIndex.value === -1
    ? undefined
    : visibleFeatures.value[activeIndex.value],
);

function openFeature(id: string): void {
  activeId.value = id;
  detailOpen.value = true;
}

function step(delta: number): void {
  const next = visibleFeatures.value[activeIndex.value + delta];
  if (next) {
    activeId.value = next.id;
  }
}
</script>

<style lang="scss" scoped>
.features {
  width: 100%;
  max-width: 1080px;
  padding-top: clamp(56px, 10vh, 104px);
}

.features__header {
  max-width: 62ch;
}

.features__eyebrow {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--md3-primary);
}

.features__title {
  margin: 10px 0 0;
  font-size: clamp(1.6rem, 3.2vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--md3-on-surface);
}

.features__subtitle {
  margin: 12px 0 0;
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--md3-on-surface-variant);
}

/* ========================================================= FILTER */
.features__filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 28px;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 9999px;
  color: var(--md3-on-surface-variant);
  background: transparent;
  transition:
    color 0.25s var(--md3-easing-emphasized, ease),
    background-color 0.25s var(--md3-easing-emphasized, ease),
    border-color 0.25s var(--md3-easing-emphasized, ease);
}

.filter-pill:hover {
  background: var(--md3-surface-container);
}

.filter-pill--active,
.filter-pill--active:hover {
  border-color: transparent;
  color: var(--md3-on-primary-container);
  background: var(--md3-primary-container);
}

.filter-pill__count {
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0.6;
}

/* =========================================================== GRID */
.features__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  grid-auto-flow: dense;
  gap: 16px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.features__cell {
  grid-column: span 2;
  display: flex;
}

.features__cell--wide {
  grid-column: span 3;
}

.feature-card {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  width: 100%;
  padding: 24px;
  font: inherit;
  text-align: start;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 28px;
  background: var(--md3-surface-container);
  transition:
    border-radius 0.35s var(--md3-easing-emphasized, ease),
    background-color 0.35s var(--md3-easing-emphasized, ease),
    transform 0.35s var(--md3-easing-emphasized, ease);
}

.feature-card--featured {
  background: var(--md3-surface-container-low);
  border-color: var(--md3-outline-variant);
}

.feature-card:hover,
.feature-card:focus-visible {
  border-radius: 28px 48px 28px 48px;
  background: var(--md3-surface-container-high);
}

@media (prefers-reduced-motion: no-preference) {
  .feature-card:hover,
  .feature-card:focus-visible {
    transform: translateY(-3px);
  }
}

.feature-card__icon {
  display: inline-flex;
  padding: 12px;
  border-radius: 16px;
  color: var(--md3-on-secondary-container);
  background: var(--md3-secondary-container);
}

/* Alternate the icon tints so the grid doesn't look stamped out. */
.features__cell:nth-child(3n + 2) .feature-card__icon {
  color: var(--md3-on-primary-container);
  background: var(--md3-primary-container);
}

.features__cell:nth-child(3n) .feature-card__icon {
  color: var(--md3-on-tertiary-container);
  background: var(--md3-tertiary-container);
}

.feature-card__title {
  margin-top: 16px;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: var(--md3-on-surface);
}

.feature-card--featured .feature-card__title {
  font-size: 1.25rem;
}

.feature-card__text {
  margin-top: 8px;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--md3-on-surface-variant);
}

.feature-card__more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  padding-top: 16px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--md3-primary);
}

.feature-card__more .q-icon {
  transition: transform 0.25s var(--md3-easing-emphasized, ease);
}

.feature-card:hover .feature-card__more .q-icon,
.feature-card:focus-visible .feature-card__more .q-icon {
  transform: translateX(4px);
}

/* ========================================================= EXTRAS */
.features__extras {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 28px;
}

.features__extras-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--md3-on-surface-variant);
}

.features__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-size: 0.82rem;
  font-weight: 500;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 9999px;
  color: var(--md3-on-surface-variant);
}

/* ==================================================== RESPONSIVE */
@media (max-width: 1100px) {
  .features__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .features__cell,
  .features__cell--wide {
    grid-column: span 2;
  }
}

@media (max-width: 700px) {
  .features__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .features__cell,
  .features__cell--wide {
    grid-column: span 1;
  }
}
</style>

<i18n lang="yaml" locale="en">
eyebrow: 'For organizers'
title: 'Everything an event needs, in one place'
subtitle: 'Everything that replaces the spreadsheet, the paper forms and the endless email chain. Open any card to see how it works.'
filter_label: 'Filter features by area'
card_action: 'Details'
extras_label: 'Also included:'
category:
  all: 'Everything'
  registration: 'Registration'
  planning: 'Planning'
  communication: 'Communication'
  trust: 'Team & trust'
extra:
  realtime: 'Live updates across your team'
  languages: 'Five interface languages'
  multilingual_forms: 'Multilingual forms & emails'
  mobile: 'Works on phone and desktop'
  waitlist: 'Automatic waiting lists'
  limits: 'Capacity and age limits'
  window: 'Registration opening and closing times'
  print: 'Print layouts for lists and the calendar'
  navigation: 'Hide the features an event does not need'
  two_factor: 'Two-factor authentication'
  dark_mode: 'Dark mode'
  self_host: 'Self-hosting with Docker'
feature:
  forms:
    title: 'Ask exactly the questions you need'
    text: 'Build your own registration form — your questions, your wording, in every language you offer.'
    detail: 'Drag in the questions you need and leave out the ones you don’t. A question can stay hidden until an earlier answer calls for it, so nobody wades through fields that don’t apply to them. Set a date for the form to open and one for it to close, and it takes care of itself from there.'
    point:
      1: 'Your questions, your wording, across as many pages as you like'
      2: 'Questions that show up only when an earlier answer calls for them'
      3: 'Repeating sections for answers that come in several — guardians, emergency contacts'
      4: 'File uploads, date and country pickers, and checks that catch typos'
      5: 'Give the form an opening and a closing date — it opens and shuts on its own'
      6: 'Translate every label and match the form to your colours'
  registrations:
    title: 'Registration lists you shape yourself'
    text: 'Everyone who signs up appears in one list, showing the columns you picked — ready to filter, print and work through.'
    detail: 'Decide up front whether places are handed out automatically or only once you have read each sign-up. From there it is one list: you choose which answers become columns and how each is shown, save that as a template, and switch between an arrival list, an allergy list and a payment overview without touching the data. Columns of your own sit next to the form answers, so the team can note who has paid or who still needs a bus seat straight in the table.'
    point:
      1: 'Hand out places automatically, or check each sign-up yourself first'
      2: 'Save a table template for every list you actually need'
      3: 'Columns that show properly: country flags, dates, ages, files, statuses'
      4: 'Add columns of your own and write notes straight into a cell'
      5: 'Search, sort and filter by status, group or any answer'
      6: 'Open a sign-up to read it in full, fix an answer, or move someone off the waiting list'
      7: 'Print-ready layouts for the folder you take on site'
  emails:
    title: 'Emails that send themselves'
    text: 'Confirmation, acceptance and waitlist mails go out automatically — in your wording and in the registrant’s language.'
    detail: 'Each event carries its own set of templates, triggered by what happens to a registration. Write them once with placeholders for names, dates and answers, keep a version per language, and the queue delivers them in the background while you keep working.'
    point:
      1: 'Templates for submission, acceptance, waitlist and waitlist acceptance'
      2: 'Placeholders pull in names, dates and any answer from the form'
      3: 'One version per language — every registrant reads their own'
      4: 'Queued and retried in the background, with delivery status'
  dashboard:
    title: 'The whole event on one screen'
    text: 'Capacity, pending registrations, waiting list and team at a glance — plus the demographics you get asked about.'
    detail: 'The dashboard opens with the numbers that come up in every planning meeting: how many are in, how many are waiting, how many leaders. Below them, the demographics explorer breaks registrations down by age, gender or country, and the tasks due next sit right beside it.'
    point:
      1: 'Live counts for accepted, pending, waitlisted and team'
      2: 'Demographics explorer by age, gender and country'
      3: 'Country breakdown for international events'
      4: 'Tasks due next, and shortcuts into every planner'
  rooms:
    title: 'Room and bed planner'
    text: 'Lay out rooms and beds, then fill them without accidentally mixing genders or roles.'
    detail: 'Every room holds individually named beds, and the planner suggests only the people who actually fit — matching the room’s gender and keeping participants and staff apart by default. Occupancy stays visible while you work, so you spot the last free bed before you promise it.'
    point:
      1: 'Rooms with individually named beds'
      2: 'Suggestions filtered by gender and by role'
      3: 'Live occupancy, and who is still waiting for a bed'
      4: 'Room and bed available as columns in your registration lists'
      5: 'Reorder rooms to match the actual building'
  team:
    title: 'Your team, with exactly the right access'
    text: 'Invite coordinators and counselors by email and give each of them only the permissions their job needs.'
    detail: 'Access is granted per event and per area: someone can plan the program or run the duty roster without being able to touch the participant list, or read that list without being able to change it. Invitations work before the person has an account, and access can be set to expire once the event is over.'
    point:
      1: 'Invite by email — the account is created when they accept'
      2: 'Fine-grained permissions per area, not one blunt admin flag'
      3: 'Access that expires automatically after the event'
      4: 'Everyone sees each other’s changes live, without reloading'
  program:
    title: 'Program planner'
    text: 'Drag the week into shape — with an A and a B plan for the weather, a backlog for loose ideas, and a calendar you can print.'
    detail: 'Program items sit on a day grid running from arrival to departure, and you drag them into place. Each item belongs to plan A, plan B or both — a rain plan lying ready beside the sunshine one, or two halves of a group going separate ways. Ideas without a slot yet wait in the backlog until you pull them onto a day, and every title, description and location carries its own translations.'
    point:
      1: 'A day-by-day grid from arrival to departure, filled by drag and drop'
      2: 'An A and a B plan side by side — good weather and bad, or a group that splits'
      3: 'A backlog for ideas you want to park now and place later'
      4: 'Titles, details and locations translatable, so an international team reads the plan in its own language'
      5: 'The whole team plans in the same shared view'
      6: 'A printable calendar for the notice board'
  messages:
    title: 'Write to exactly the right people'
    text: 'Pick the group, not the addresses. Nobody gets copied over by hand, nobody gets missed.'
    detail: 'You choose recipients by who they are — everyone accepted, everyone still waiting, the leaders, one country — and the addresses come along by themselves. Nothing to copy out of a spreadsheet, no address pasted into the wrong line, nobody quietly left off. Attachments come with it, and every message stays in the history.'
    point:
      1: 'Pick a group, not a list of addresses'
      2: 'Personalised placeholders and file attachments'
      3: 'A full send history — reuse any message as a template'
  newsletters:
    title: 'Newsletters beyond a single event'
    text: 'Keep a subscriber list of your own, independent of any event, and write to it whenever there is news.'
    detail: 'Newsletters are their own thing: people subscribe once and stay reachable between events. Compose, attach, send — and reuse an old issue as the starting point for the next one. Every mail carries a one-click unsubscribe link, so the list keeps itself clean.'
    point:
      1: 'A subscriber list that outlives any single event'
      2: 'Reuse any sent issue as a template'
      3: 'A one-click unsubscribe link on every mail'
  tasks:
    title: 'A shared to-do list'
    text: 'Track what still needs doing, who is doing it and what is overdue — without reaching for a second tool.'
    detail: 'Tasks belong to the event, not to somebody’s private inbox. Assign them with a deadline, or leave them open for whoever gets there first, filter down to your own, and see what is due next right on the dashboard.'
    point:
      1: 'Assign a task with a deadline, or leave it open for anyone to pick up'
      2: 'Filter by yours, unassigned or already completed'
      3: 'Due tasks surface on the event dashboard'
  chores:
    title: 'Duty roster'
    text: 'Rotate kitchen duty, dishwashing and everything else nobody volunteers for — fairly, without keeping score yourself.'
    detail: 'Define the chores your event actually has, then assign them day by day. Rather than leaving you to guess, the planner proposes who is up next — individual people or a whole room at a time — putting whoever has done the fewest turns, longest ago, at the top of the list. The full history settles the “but we did it last time” argument on the spot.'
    point:
      1: 'Define your own recurring chores — kitchen, dishes, anything'
      2: 'Assign per day, with the upcoming duties up front'
      3: 'Suggestions for who is next — individual people or a whole room'
      4: 'Fairness built in: fewest turns first, then whoever waited longest'
      5: 'A full history of who has already taken a turn'
  files:
    title: 'Documents in one place'
    text: 'Upload the forms and information sheets your event needs, share them by link, and see which ones are still missing.'
    detail: 'Every event has a document shelf: the packing list, the medical form, the bus plan. Files sent in with a registration are kept alongside it, and the missing-documents view tells you whose paperwork is still outstanding before you go looking for it.'
    point:
      1: 'Upload, replace and share event documents by link'
      2: 'Files sent in with a registration stay attached to it'
      3: 'A missing-documents list, so nothing is chased from memory'
  directory:
    title: 'A public page for every event'
    text: 'Listed events appear in a searchable directory with dates, location and a direct link to the registration form.'
    detail: 'You decide per event whether it is listed. Listed events show up in the public directory, where people search by name and filter by date range and country, then open a page with all the details and the registration form — no account needed anywhere along the way.'
    point:
      1: 'Search and filter by name, date range and country'
      2: 'A public page with dates, location, price and age range'
      3: 'Listed or unlisted per event — or just share the link privately'
  organizations:
    title: 'Built for an organisation, not one person'
    text: 'Events and newsletters belong to your organisation, with its own members, overview and verified badge.'
    detail: 'An organisation owns its events and newsletters, so nothing is tied to a single person’s login. Members join the organisation, while running an individual event is still granted separately — which keeps participant data out of reach of people who only administer the organisation.'
    point:
      1: 'Events and newsletters owned by the organisation, not by a person'
      2: 'Members and admins, with an organisation-wide overview'
      3: 'Verified before an event goes public or a newsletter goes out'
  privacy:
    title: 'A structured place for your privacy information'
    text: 'Write down what you collect and why, along the lines of GDPR Article 13, and give registrants a permanent link to it.'
    detail: 'Your organisation writes a baseline notice — purposes, data categories, recipients, retention — and each event adds only what is specific to it: this season’s bus company, this year’s insurer, the photos you intend to publish. Registrants reach the combined text at a permanent address, linked from their confirmation mail. @:app_name gives the notice its structure and its home; what goes in it, and whether it is complete and correct, remains yours to decide.'
    point:
      1: 'Fields for purposes, data categories, recipients and retention'
      2: 'One organisation baseline, extended per event rather than replaced'
      3: 'A permanent privacy page registrants can come back to'
      4: 'A separate place to record special-category data and its legal basis'
</i18n>

<i18n lang="yaml" locale="de">
eyebrow: 'Für Organisatoren'
title: 'Alles, was eine Veranstaltung braucht — an einem Ort'
subtitle: 'Alles, was Tabelle, Papierformular und endlose E-Mail-Kette ersetzt. Öffne eine Karte, um zu sehen, wie es funktioniert.'
filter_label: 'Funktionen nach Bereich filtern'
card_action: 'Details'
extras_label: 'Außerdem enthalten:'
category:
  all: 'Alles'
  registration: 'Anmeldung'
  planning: 'Planung'
  communication: 'Kommunikation'
  trust: 'Team & Vertrauen'
extra:
  realtime: 'Live-Updates im ganzen Team'
  languages: 'Fünf Oberflächensprachen'
  multilingual_forms: 'Mehrsprachige Formulare & E-Mails'
  mobile: 'Läuft auf Smartphone und Desktop'
  waitlist: 'Automatische Wartelisten'
  limits: 'Teilnehmer- und Altersgrenzen'
  window: 'Anmeldezeitraum mit Start und Ende'
  print: 'Druckansichten für Listen und Kalender'
  navigation: 'Nicht benötigte Funktionen ausblenden'
  two_factor: 'Zwei-Faktor-Authentifizierung'
  dark_mode: 'Dark Mode'
  self_host: 'Selbst hosten mit Docker'
feature:
  forms:
    title: 'Frag genau das, was du wissen musst'
    text: 'Bau dein eigenes Anmeldeformular — deine Fragen, deine Formulierungen, in jeder Sprache, die du anbietest.'
    detail: 'Zieh die Fragen hinein, die du brauchst, und lass die anderen weg. Eine Frage kann verborgen bleiben, bis eine frühere Antwort sie nötig macht — so kämpft sich niemand durch Felder, die ihn nichts angehen. Leg ein Datum fürs Öffnen und eines fürs Schließen fest, danach läuft es von allein.'
    point:
      1: 'Deine Fragen, deine Formulierungen, auf so vielen Seiten wie du magst'
      2: 'Fragen, die erst auftauchen, wenn eine frühere Antwort sie nötig macht'
      3: 'Wiederholbare Abschnitte für mehrfache Angaben — Sorgeberechtigte, Notfallkontakte'
      4: 'Datei-Uploads, Datums- und Länderauswahl und Prüfungen, die Tippfehler abfangen'
      5: 'Gib dem Formular ein Start- und ein Enddatum — es öffnet und schließt von selbst'
      6: 'Jede Beschriftung übersetzen und das Formular an deine Farben anpassen'
  registrations:
    title: 'Anmeldelisten, die du selbst gestaltest'
    text: 'Alle, die sich anmelden, stehen in einer Liste mit den Spalten, die du ausgewählt hast — bereit zum Filtern, Drucken und Abarbeiten.'
    detail: 'Entscheide vorab, ob Plätze automatisch vergeben werden oder erst, wenn du jede Anmeldung gelesen hast. Danach ist es eine Liste: Du wählst, welche Antworten zu Spalten werden und wie sie aussehen, speicherst das als Vorlage und wechselst zwischen Anreiseliste, Allergieliste und Zahlungsübersicht, ohne die Daten anzufassen. Eigene Spalten stehen neben den Formularantworten — so notiert das Team direkt in der Tabelle, wer bezahlt hat oder wer noch einen Busplatz braucht.'
    point:
      1: 'Plätze automatisch vergeben oder jede Anmeldung erst selbst prüfen'
      2: 'Eine Tabellenvorlage für jede Liste, die du wirklich brauchst'
      3: 'Spalten, die richtig aussehen: Länderflaggen, Daten, Alter, Dateien, Status'
      4: 'Eigene Spalten anlegen und Notizen direkt in die Zelle schreiben'
      5: 'Suchen, sortieren und filtern nach Status, Gruppe oder jeder Antwort'
      6: 'Eine Anmeldung öffnen, vollständig lesen, eine Antwort korrigieren oder jemanden von der Warteliste nachrücken lassen'
      7: 'Druckfertige Layouts für den Ordner, den du mitnimmst'
  emails:
    title: 'E-Mails, die sich selbst versenden'
    text: 'Bestätigungs-, Zusage- und Warteliste-Mails gehen automatisch raus — in deinen Worten und in der Sprache der Anmeldenden.'
    detail: 'Jede Veranstaltung hat ihre eigenen Vorlagen, ausgelöst davon, was mit einer Anmeldung passiert. Einmal geschrieben, mit Platzhaltern für Namen, Termine und Antworten und einer Fassung pro Sprache — die Queue stellt sie im Hintergrund zu, während du weiterarbeitest.'
    point:
      1: 'Vorlagen für Eingang, Zusage, Warteliste und Nachrücken'
      2: 'Platzhalter für Namen, Termine und jede Antwort aus dem Formular'
      3: 'Eine Fassung pro Sprache — alle lesen ihre eigene'
      4: 'Im Hintergrund versendet und wiederholt, mit Zustellstatus'
  dashboard:
    title: 'Die ganze Veranstaltung auf einem Bildschirm'
    text: 'Kapazität, offene Anmeldungen, Warteliste und Team auf einen Blick — dazu die Zahlen, nach denen immer gefragt wird.'
    detail: 'Das Dashboard beginnt mit den Zahlen, die in jeder Planungsrunde kommen: wie viele dabei sind, wie viele warten, wie viele Betreuende. Darunter schlüsselt der Demografie-Explorer die Anmeldungen nach Alter, Geschlecht oder Land auf, und die nächsten fälligen Aufgaben stehen direkt daneben.'
    point:
      1: 'Aktuelle Zahlen für Zusagen, Offene, Warteliste und Team'
      2: 'Demografie-Explorer nach Alter, Geschlecht und Land'
      3: 'Länderaufschlüsselung für internationale Veranstaltungen'
      4: 'Die nächsten fälligen Aufgaben und Abkürzungen in jeden Planer'
  rooms:
    title: 'Zimmer- und Bettenplaner'
    text: 'Lege Zimmer und Betten an und belege sie, ohne versehentlich Geschlechter oder Rollen zu mischen.'
    detail: 'Jedes Zimmer hat einzeln benannte Betten, und der Planer schlägt nur Personen vor, die wirklich passen — zum Geschlecht des Zimmers und standardmäßig getrennt nach Teilnehmenden und Team. Die Belegung bleibt sichtbar, sodass du das letzte freie Bett siehst, bevor du es zusagst.'
    point:
      1: 'Zimmer mit einzeln benannten Betten'
      2: 'Vorschläge gefiltert nach Geschlecht und Rolle'
      3: 'Belegung in Echtzeit — und wer noch auf ein Bett wartet'
      4: 'Zimmer und Bett als Spalten in deinen Anmeldelisten verfügbar'
      5: 'Zimmer so sortieren, wie das Haus tatsächlich aufgebaut ist'
  team:
    title: 'Dein Team mit genau den richtigen Rechten'
    text: 'Lade Koordinatorinnen und Betreuer per E-Mail ein und gib jedem nur die Rechte, die die Aufgabe braucht.'
    detail: 'Zugriff wird pro Veranstaltung und pro Bereich vergeben: Jemand kann das Programm planen oder den Dienstplan führen, ohne die Teilnehmendenliste anfassen zu können — oder diese Liste lesen, ohne sie zu ändern. Einladungen funktionieren, bevor die Person ein Konto hat, und der Zugriff kann nach der Veranstaltung automatisch ablaufen.'
    point:
      1: 'Einladung per E-Mail — das Konto entsteht beim Annehmen'
      2: 'Fein abgestufte Rechte pro Bereich statt eines groben Admin-Schalters'
      3: 'Zugriff, der nach der Veranstaltung automatisch endet'
      4: 'Alle sehen die Änderungen der anderen live, ohne neu zu laden'
  program:
    title: 'Programmplaner'
    text: 'Zieh die Woche zurecht — mit A- und B-Plan fürs Wetter, einem Backlog für lose Ideen und einem druckbaren Kalender.'
    detail: 'Programmpunkte liegen auf einem Tagesraster von der Anreise bis zur Abreise, und du ziehst sie an ihren Platz. Jeder Punkt gehört zu Plan A, zu Plan B oder zu beiden — der Regenplan liegt neben dem Schönwetterprogramm bereit, oder zwei Hälften der Gruppe gehen getrennte Wege. Ideen ohne festen Slot warten im Backlog, bis du sie auf einen Tag ziehst, und jeder Titel, jede Beschreibung und jeder Ort trägt eigene Übersetzungen.'
    point:
      1: 'Ein Tagesraster von der Anreise bis zur Abreise, per Drag-and-drop gefüllt'
      2: 'A- und B-Plan nebeneinander — gutes und schlechtes Wetter oder eine geteilte Gruppe'
      3: 'Ein Backlog für Ideen, die du jetzt parken und später einplanen willst'
      4: 'Titel, Details und Orte übersetzbar — ein internationales Team liest den Plan in seiner eigenen Sprache'
      5: 'Das ganze Team plant in derselben Ansicht'
      6: 'Ein druckbarer Kalender für das schwarze Brett'
  messages:
    title: 'Schreib genau den richtigen Leuten'
    text: 'Wähl die Gruppe, nicht die Adressen. Niemand wird von Hand kopiert, niemand vergessen.'
    detail: 'Du wählst die Empfänger danach aus, wer sie sind — alle Zusagen, alle Wartenden, die Betreuenden, ein Land — und die Adressen kommen von selbst mit. Nichts aus einer Tabelle herauskopieren, keine Adresse in der falschen Zeile, niemand still übersehen. Anhänge gehen mit, und jede Nachricht bleibt im Verlauf.'
    point:
      1: 'Eine Gruppe wählen statt einer Adressliste'
      2: 'Persönliche Platzhalter und Datei-Anhänge'
      3: 'Vollständiger Verlauf — jede Nachricht als Vorlage wiederverwendbar'
  newsletters:
    title: 'Newsletter über eine einzelne Veranstaltung hinaus'
    text: 'Führe eine eigene Abonnentenliste, unabhängig von jeder Veranstaltung, und schreibe ihr, wenn es Neues gibt.'
    detail: 'Newsletter sind eine eigene Sache: Wer sich einmal einträgt, bleibt zwischen den Veranstaltungen erreichbar. Schreiben, anhängen, senden — und eine alte Ausgabe als Ausgangspunkt für die nächste nehmen. Jede Mail enthält einen Abmeldelink mit einem Klick, damit die Liste sich selbst sauber hält.'
    point:
      1: 'Eine Abonnentenliste, die einzelne Veranstaltungen überdauert'
      2: 'Jede gesendete Ausgabe als Vorlage wiederverwenden'
      3: 'Abmeldelink mit einem Klick in jeder Mail'
  tasks:
    title: 'Eine gemeinsame To-do-Liste'
    text: 'Behalte im Blick, was noch zu tun ist, wer es macht und was überfällig ist — ohne ein zweites Werkzeug.'
    detail: 'Aufgaben gehören zur Veranstaltung, nicht in irgendjemandes privaten Posteingang. Weise sie mit Frist zu oder lass sie offen für die Person, die zuerst Zeit hat, filtere auf deine eigenen, und sieh direkt im Dashboard, was als Nächstes fällig ist.'
    point:
      1: 'Aufgabe mit Frist zuweisen oder offen lassen, damit sie jemand übernimmt'
      2: 'Filtern nach eigenen, nicht zugewiesenen oder erledigten'
      3: 'Fällige Aufgaben erscheinen im Dashboard der Veranstaltung'
  chores:
    title: 'Dienstplan'
    text: 'Küchendienst, Abwasch und alles andere, wofür sich niemand freiwillig meldet, reihum verteilen — fair, ohne selbst Buch zu führen.'
    detail: 'Lege die Dienste an, die es bei euch wirklich gibt, und teile sie Tag für Tag zu. Statt dich raten zu lassen, schlägt der Planer vor, wer als Nächstes dran ist — einzelne Personen oder ein ganzes Zimmer auf einmal — und stellt nach oben, wer die wenigsten Dienste hatte und am längsten nicht dran war. Die vollständige Historie beendet die Diskussion „aber wir waren letztes Mal dran“ auf der Stelle.'
    point:
      1: 'Eigene wiederkehrende Dienste anlegen — Küche, Abwasch, was auch immer'
      2: 'Pro Tag zuteilen, Anstehendes zuerst'
      3: 'Vorschläge, wer als Nächstes dran ist — einzelne Personen oder ein ganzes Zimmer'
      4: 'Fairness eingebaut: die wenigsten Dienste zuerst, dann wer am längsten wartet'
      5: 'Vollständige Historie, wer schon an der Reihe war'
  files:
    title: 'Dokumente an einem Ort'
    text: 'Lade die Formulare und Infoblätter deiner Veranstaltung hoch, teile sie per Link und sieh, welche noch fehlen.'
    detail: 'Jede Veranstaltung hat ihr Dokumentenregal: Packliste, medizinisches Formular, Busplan. Dateien, die mit einer Anmeldung eingehen, liegen direkt bei ihr, und die Ansicht der fehlenden Dokumente sagt dir, wessen Unterlagen noch ausstehen, bevor du suchen gehst.'
    point:
      1: 'Dokumente hochladen, ersetzen und per Link teilen'
      2: 'Mit einer Anmeldung eingereichte Dateien bleiben bei ihr'
      3: 'Liste der fehlenden Dokumente — nichts wird aus dem Kopf nachgehalten'
  directory:
    title: 'Eine öffentliche Seite für jede Veranstaltung'
    text: 'Gelistete Veranstaltungen erscheinen in einem durchsuchbaren Verzeichnis mit Terminen, Ort und direktem Link zum Anmeldeformular.'
    detail: 'Du entscheidest pro Veranstaltung, ob sie gelistet wird. Gelistete erscheinen im öffentlichen Verzeichnis, wo nach Namen gesucht und nach Zeitraum und Land gefiltert wird; dahinter liegt eine Seite mit allen Details und dem Anmeldeformular — ganz ohne Konto.'
    point:
      1: 'Suchen und filtern nach Name, Zeitraum und Land'
      2: 'Öffentliche Seite mit Terminen, Ort, Preis und Altersspanne'
      3: 'Pro Veranstaltung gelistet oder nicht — oder den Link privat teilen'
  organizations:
    title: 'Für eine Organisation gebaut, nicht für eine Person'
    text: 'Veranstaltungen und Newsletter gehören deiner Organisation — mit eigenen Mitgliedern, Überblick und Verifizierung.'
    detail: 'Eine Organisation besitzt ihre Veranstaltungen und Newsletter, sodass nichts am Login einer einzelnen Person hängt. Mitglieder treten der Organisation bei, während die Leitung einer konkreten Veranstaltung weiterhin separat vergeben wird — so bleiben Teilnehmerdaten außer Reichweite derer, die nur die Organisation verwalten.'
    point:
      1: 'Veranstaltungen und Newsletter gehören der Organisation, nicht einer Person'
      2: 'Mitglieder und Admins mit organisationsweitem Überblick'
      3: 'Verifiziert, bevor eine Veranstaltung öffentlich wird oder ein Newsletter rausgeht'
  privacy:
    title: 'Ein strukturierter Ort für deine Datenschutzhinweise'
    text: 'Halte fest, was du erhebst und wozu — angelehnt an Art. 13 DSGVO — und gib den Anmeldenden einen dauerhaften Link darauf.'
    detail: 'Deine Organisation schreibt einen Basistext — Zwecke, Datenkategorien, Empfänger, Speicherdauer — und jede Veranstaltung ergänzt nur, was für sie besonders ist: das Busunternehmen dieser Saison, der Versicherer dieses Jahres, die Fotos, die ihr veröffentlichen wollt. Anmeldende erreichen den kombinierten Text unter einer dauerhaften Adresse, verlinkt in ihrer Bestätigungsmail. @:app_name gibt dem Hinweis Struktur und einen festen Platz; was darin steht und ob er vollständig und richtig ist, entscheidest weiterhin du.'
    point:
      1: 'Felder für Zwecke, Datenkategorien, Empfänger und Speicherdauer'
      2: 'Ein Basistext der Organisation, pro Veranstaltung ergänzt statt ersetzt'
      3: 'Eine dauerhafte Datenschutzseite, zu der Anmeldende zurückkehren können'
      4: 'Ein eigener Platz für besondere Datenkategorien und ihre Rechtsgrundlage'
</i18n>

<i18n lang="yaml" locale="fr">
eyebrow: 'Pour les organisateurs'
title: 'Tout ce qu’un événement demande, au même endroit'
subtitle: 'Tout ce qui remplace le tableur, les formulaires papier et l’interminable chaîne d’e-mails. Ouvrez une carte pour voir comment cela fonctionne.'
filter_label: 'Filtrer les fonctionnalités par domaine'
card_action: 'Détails'
extras_label: 'Également inclus :'
category:
  all: 'Tout'
  registration: 'Inscription'
  planning: 'Planification'
  communication: 'Communication'
  trust: 'Équipe et confiance'
extra:
  realtime: 'Mises à jour en direct pour toute l’équipe'
  languages: 'Cinq langues d’interface'
  multilingual_forms: 'Formulaires et e-mails multilingues'
  mobile: 'Fonctionne sur mobile et ordinateur'
  waitlist: 'Listes d’attente automatiques'
  limits: 'Limites de places et d’âge'
  window: 'Ouverture et fermeture des inscriptions'
  print: 'Mises en page imprimables des listes et du calendrier'
  navigation: 'Masquer les fonctionnalités inutiles à un événement'
  two_factor: 'Authentification à deux facteurs'
  dark_mode: 'Mode sombre'
  self_host: 'Auto-hébergement avec Docker'
feature:
  forms:
    title: 'Posez exactement les questions qu’il vous faut'
    text: 'Composez votre propre formulaire d’inscription — vos questions, vos formulations, dans chaque langue que vous proposez.'
    detail: 'Glissez les questions dont vous avez besoin et laissez de côté les autres. Une question peut rester masquée jusqu’à ce qu’une réponse précédente l’appelle : personne ne se débat avec des champs qui ne le concernent pas. Fixez une date d’ouverture et une date de fermeture, et le reste se fait tout seul.'
    point:
      1: 'Vos questions, vos formulations, sur autant de pages que vous voulez'
      2: 'Des questions qui n’apparaissent que si une réponse précédente les appelle'
      3: 'Sections répétables pour les réponses multiples — responsables, contacts d’urgence'
      4: 'Téléversements, sélecteurs de date et de pays, et contrôles qui attrapent les fautes de frappe'
      5: 'Donnez au formulaire une date d’ouverture et de fermeture — il s’ouvre et se ferme seul'
      6: 'Traduisez chaque libellé et adaptez le formulaire à vos couleurs'
  registrations:
    title: 'Des listes d’inscrits que vous façonnez'
    text: 'Toutes les personnes inscrites figurent dans une seule liste, avec les colonnes que vous avez choisies — prête à filtrer, imprimer et traiter.'
    detail: 'Décidez d’emblée si les places sont attribuées automatiquement ou seulement après avoir lu chaque inscription. Ensuite, c’est une seule liste : vous choisissez quelles réponses deviennent des colonnes et comment chacune s’affiche, enregistrez cela comme modèle et passez de la liste d’arrivée à la liste des allergies ou au suivi des paiements sans toucher aux données. Vos propres colonnes se placent à côté des réponses du formulaire : l’équipe note qui a payé ou qui attend encore une place dans le bus directement dans le tableau.'
    point:
      1: 'Attribuer les places automatiquement, ou examiner chaque inscription d’abord'
      2: 'Un modèle de tableau enregistré pour chaque liste réellement utile'
      3: 'Des colonnes bien rendues : drapeaux, dates, âges, fichiers, statuts'
      4: 'Ajoutez vos propres colonnes et écrivez vos notes dans la cellule'
      5: 'Recherche, tri et filtres par statut, groupe ou n’importe quelle réponse'
      6: 'Ouvrir une inscription pour la lire en entier, corriger une réponse ou repêcher quelqu’un de la liste d’attente'
      7: 'Des mises en page prêtes à imprimer pour le classeur emporté sur place'
  emails:
    title: 'Des e-mails qui partent tout seuls'
    text: 'Confirmations, acceptations et mises en liste d’attente partent automatiquement — avec vos mots, dans la langue de la personne inscrite.'
    detail: 'Chaque événement porte ses propres modèles, déclenchés par ce qui arrive à une inscription. Rédigez-les une fois avec des variables pour les noms, les dates et les réponses, gardez une version par langue, et la file d’attente les distribue en arrière-plan pendant que vous continuez à travailler.'
    point:
      1: 'Modèles pour le dépôt, l’acceptation, la liste d’attente et le repêchage'
      2: 'Des variables qui reprennent noms, dates et n’importe quelle réponse'
      3: 'Une version par langue — chacun lit la sienne'
      4: 'Envoyés et réessayés en arrière-plan, avec l’état de distribution'
  dashboard:
    title: 'Tout l’événement sur un seul écran'
    text: 'Capacité, inscriptions en attente, liste d’attente et équipe d’un coup d’œil — plus les chiffres qu’on vous réclame toujours.'
    detail: 'Le tableau de bord commence par les chiffres qui reviennent à chaque réunion : combien sont inscrits, combien attendent, combien d’animateurs. En dessous, l’explorateur démographique ventile les inscriptions par âge, genre ou pays, et les tâches à échéance proche se trouvent juste à côté.'
    point:
      1: 'Compteurs à jour des acceptés, en attente, en liste d’attente et de l’équipe'
      2: 'Explorateur démographique par âge, genre et pays'
      3: 'Répartition par pays pour les événements internationaux'
      4: 'Les prochaines tâches dues et des raccourcis vers chaque planificateur'
  rooms:
    title: 'Planificateur de chambres et de lits'
    text: 'Créez les chambres et les lits, puis remplissez-les sans mélanger les genres ou les rôles par inadvertance.'
    detail: 'Chaque chambre contient des lits nommés individuellement, et le planificateur ne propose que les personnes qui conviennent — au genre de la chambre, et en séparant par défaut participants et encadrants. L’occupation reste visible pendant que vous travaillez : vous voyez le dernier lit libre avant de le promettre.'
    point:
      1: 'Des chambres avec des lits nommés un par un'
      2: 'Des suggestions filtrées par genre et par rôle'
      3: 'L’occupation en direct, et qui attend encore un lit'
      4: 'Chambre et lit disponibles en colonnes dans vos listes d’inscrits'
      5: 'Réorganisez les chambres comme le bâtiment réel'
  team:
    title: 'Votre équipe, avec les bons accès'
    text: 'Invitez coordinateurs et animateurs par e-mail et donnez à chacun uniquement les droits que son rôle exige.'
    detail: 'L’accès se donne par événement et par domaine : quelqu’un peut préparer le programme ou tenir le tableau de service sans pouvoir toucher à la liste des participants, ou lire cette liste sans pouvoir la modifier. Les invitations fonctionnent avant même que la personne ait un compte, et l’accès peut expirer une fois l’événement terminé.'
    point:
      1: 'Invitation par e-mail — le compte se crée à l’acceptation'
      2: 'Des droits fins par domaine, pas un unique interrupteur « admin »'
      3: 'Un accès qui expire automatiquement après l’événement'
      4: 'Chacun voit les changements des autres en direct, sans recharger'
  program:
    title: 'Planificateur de programme'
    text: 'Composez la semaine par glisser-déposer — avec un plan A et un plan B pour la météo, un backlog pour les idées en vrac et un calendrier imprimable.'
    detail: 'Les activités se posent sur une grille journalière allant de l’arrivée au départ, et vous les faites glisser à leur place. Chaque activité appartient au plan A, au plan B ou aux deux — le plan de pluie prêt à côté du programme beau temps, ou deux moitiés du groupe partant chacune de son côté. Les idées sans créneau attendent dans le backlog jusqu’à ce que vous les tiriez sur un jour, et chaque titre, description et lieu porte ses propres traductions.'
    point:
      1: 'Une grille jour par jour, de l’arrivée au départ, remplie par glisser-déposer'
      2: 'Un plan A et un plan B côte à côte — beau temps ou pluie, ou un groupe qui se sépare'
      3: 'Un backlog pour les idées à garder de côté et placer plus tard'
      4: 'Titres, détails et lieux traduisibles — une équipe internationale lit le plan dans sa propre langue'
      5: 'Toute l’équipe planifie dans la même vue partagée'
      6: 'Un calendrier imprimable pour le panneau d’affichage'
  messages:
    title: 'Écrivez exactement aux bonnes personnes'
    text: 'Choisissez le groupe, pas les adresses. Personne n’est recopié à la main, personne n’est oublié.'
    detail: 'Vous choisissez les destinataires selon ce qu’ils sont — tous les acceptés, ceux qui attendent, les animateurs, un pays — et les adresses suivent d’elles-mêmes. Rien à recopier d’un tableur, aucune adresse collée dans la mauvaise ligne, personne laissé de côté sans qu’on le voie. Les pièces jointes suivent, et chaque message reste dans l’historique.'
    point:
      1: 'Choisir un groupe, pas une liste d’adresses'
      2: 'Variables personnalisées et pièces jointes'
      3: 'Un historique complet — réutilisez n’importe quel message comme modèle'
  newsletters:
    title: 'Des infolettres au-delà d’un seul événement'
    text: 'Tenez votre propre liste d’abonnés, indépendante de tout événement, et écrivez-lui dès qu’il y a du neuf.'
    detail: 'Les infolettres vivent leur propre vie : on s’abonne une fois et l’on reste joignable entre deux événements. Rédigez, joignez, envoyez — et repartez d’un ancien numéro pour le suivant. Chaque envoi porte un lien de désabonnement en un clic, si bien que la liste se nettoie d’elle-même.'
    point:
      1: 'Une liste d’abonnés qui survit à chaque événement'
      2: 'Réutilisez n’importe quel numéro envoyé comme modèle'
      3: 'Un lien de désabonnement en un clic dans chaque envoi'
  tasks:
    title: 'Une liste de tâches partagée'
    text: 'Suivez ce qu’il reste à faire, qui s’en occupe et ce qui est en retard — sans ouvrir un second outil.'
    detail: 'Les tâches appartiennent à l’événement, pas à la boîte de réception de quelqu’un. Attribuez-les avec une échéance, ou laissez-les libres pour qui aura le temps le premier, filtrez sur les vôtres, et voyez les prochaines échéances directement sur le tableau de bord.'
    point:
      1: 'Attribuez une tâche avec une échéance, ou laissez-la libre pour qui veut la prendre'
      2: 'Filtrez par les vôtres, non attribuées ou déjà terminées'
      3: 'Les tâches dues remontent sur le tableau de bord'
  chores:
    title: 'Tableau de service'
    text: 'Faites tourner la corvée de cuisine, la vaisselle et tout ce pour quoi personne ne se porte volontaire — équitablement, sans tenir les comptes vous-même.'
    detail: 'Définissez les services qui existent réellement chez vous, puis attribuez-les jour après jour. Plutôt que de vous laisser deviner, le planificateur propose qui est le prochain — des personnes ou une chambre entière — en plaçant en tête celles qui ont fait le moins de tours, et il y a le plus longtemps. L’historique complet clôt sur-le-champ le débat du « mais c’était nous la dernière fois ».'
    point:
      1: 'Définissez vos propres services récurrents — cuisine, vaisselle, ce que vous voulez'
      2: 'Attribuez par jour, les prochains services en tête'
      3: 'Des suggestions pour le prochain tour — des personnes ou une chambre entière'
      4: 'Équité intégrée : le moins de tours d’abord, puis celui qui attend depuis le plus longtemps'
      5: 'Un historique complet de qui est déjà passé'
  files:
    title: 'Les documents au même endroit'
    text: 'Déposez les formulaires et fiches d’information de votre événement, partagez-les par lien, et voyez ceux qui manquent encore.'
    detail: 'Chaque événement a son étagère à documents : la liste de bagages, la fiche sanitaire, le plan de bus. Les fichiers arrivés avec une inscription restent rattachés à celle-ci, et la vue des documents manquants vous dit quels dossiers sont encore incomplets avant que vous ne partiez à leur recherche.'
    point:
      1: 'Déposez, remplacez et partagez les documents par lien'
      2: 'Les fichiers envoyés avec une inscription y restent attachés'
      3: 'Une liste des documents manquants — plus rien à retenir de tête'
  directory:
    title: 'Une page publique pour chaque événement'
    text: 'Les événements listés apparaissent dans un annuaire consultable avec dates, lieu et lien direct vers le formulaire.'
    detail: 'Vous décidez, événement par événement, s’il est listé. Les événements listés apparaissent dans l’annuaire public, où l’on cherche par nom et filtre par période et par pays, puis ouvre une page avec tous les détails et le formulaire d’inscription — sans compte à aucun moment.'
    point:
      1: 'Recherche et filtres par nom, période et pays'
      2: 'Une page publique avec dates, lieu, tarif et tranche d’âge'
      3: 'Listé ou non, événement par événement — ou lien partagé en privé'
  organizations:
    title: 'Pensé pour une organisation, pas pour une personne'
    text: 'Les événements et les infolettres appartiennent à votre organisation, avec ses membres, sa vue d’ensemble et sa vérification.'
    detail: 'Une organisation possède ses événements et ses infolettres : rien n’est accroché au compte d’une seule personne. On rejoint l’organisation en tant que membre, tandis que la gestion d’un événement précis reste accordée séparément — ce qui tient les données des participants hors de portée de ceux qui n’administrent que l’organisation.'
    point:
      1: 'Des événements et infolettres détenus par l’organisation, pas par une personne'
      2: 'Membres et administrateurs, avec une vue d’ensemble de l’organisation'
      3: 'Vérifiée avant qu’un événement soit public ou qu’une infolettre parte'
  privacy:
    title: 'Un cadre structuré pour vos informations de confidentialité'
    text: 'Consignez ce que vous collectez et pourquoi, dans l’esprit de l’article 13 du RGPD, avec un lien permanent pour les inscrits.'
    detail: 'Votre organisation rédige un socle — finalités, catégories de données, destinataires, durées de conservation — et chaque événement n’y ajoute que ce qui lui est propre : le transporteur de la saison, l’assureur de l’année, les photos que vous comptez publier. Les inscrits atteignent le texte consolidé à une adresse permanente, liée depuis leur e-mail de confirmation. @:app_name lui donne sa structure et son emplacement ; ce qu’il contient, et le fait qu’il soit complet et exact, reste votre décision.'
    point:
      1: 'Des champs pour les finalités, les données, les destinataires et les durées'
      2: 'Un socle d’organisation, complété par événement plutôt que remplacé'
      3: 'Une page de confidentialité permanente, consultable à tout moment'
      4: 'Un emplacement dédié aux données sensibles et à leur base légale'
</i18n>

<i18n lang="yaml" locale="pl">
eyebrow: 'Dla organizatorów'
title: 'Wszystko, czego wymaga wydarzenie, w jednym miejscu'
subtitle: 'Wszystko, co zastępuje arkusz, papierowe formularze i niekończący się łańcuszek e-maili. Otwórz dowolną kartę, aby zobaczyć, jak to działa.'
filter_label: 'Filtruj funkcje według obszaru'
card_action: 'Szczegóły'
extras_label: 'A do tego:'
category:
  all: 'Wszystko'
  registration: 'Rejestracja'
  planning: 'Planowanie'
  communication: 'Komunikacja'
  trust: 'Zespół i zaufanie'
extra:
  realtime: 'Aktualizacje na żywo w całym zespole'
  languages: 'Pięć języków interfejsu'
  multilingual_forms: 'Wielojęzyczne formularze i e-maile'
  mobile: 'Działa na telefonie i komputerze'
  waitlist: 'Automatyczne listy oczekujących'
  limits: 'Limity miejsc i wieku'
  window: 'Otwarcie i zamknięcie zapisów'
  print: 'Wydruki list i kalendarza'
  navigation: 'Ukryj funkcje, których wydarzenie nie potrzebuje'
  two_factor: 'Uwierzytelnianie dwuskładnikowe'
  dark_mode: 'Tryb ciemny'
  self_host: 'Własny hosting z Dockerem'
feature:
  forms:
    title: 'Pytaj dokładnie o to, co musisz wiedzieć'
    text: 'Zbuduj własny formularz zapisów — Twoje pytania, Twoje sformułowania, w każdym oferowanym języku.'
    detail: 'Przeciągnij pytania, których potrzebujesz, a resztę pomiń. Pytanie może pozostać ukryte, dopóki wcześniejsza odpowiedź go nie wywoła — nikt nie przedziera się przez pola, które go nie dotyczą. Ustaw datę otwarcia i datę zamknięcia, a dalej dzieje się to samo z siebie.'
    point:
      1: 'Twoje pytania, Twoje sformułowania, na dowolnej liczbie stron'
      2: 'Pytania, które pojawiają się dopiero, gdy wywoła je wcześniejsza odpowiedź'
      3: 'Powtarzalne sekcje dla odpowiedzi wielokrotnych — opiekunowie, kontakty awaryjne'
      4: 'Przesyłanie plików, wybór daty i kraju oraz kontrole wyłapujące literówki'
      5: 'Nadaj formularzowi datę otwarcia i zamknięcia — otworzy się i zamknie sam'
      6: 'Przetłumacz każdą etykietę i dopasuj formularz do swoich kolorów'
  registrations:
    title: 'Listy zgłoszeń, które układasz sam'
    text: 'Wszyscy zapisani trafiają na jedną listę z wybranymi przez Ciebie kolumnami — gotową do filtrowania, druku i pracy.'
    detail: 'Ustal z góry, czy miejsca przyznają się automatycznie, czy dopiero po przeczytaniu każdego zgłoszenia. Dalej to już jedna lista: wybierasz, które odpowiedzi stają się kolumnami i jak wyglądają, zapisujesz to jako szablon i przełączasz się między listą przyjazdów, listą alergii a przeglądem płatności bez ruszania danych. Twoje własne kolumny stoją obok odpowiedzi z formularza — zespół notuje wprost w tabeli, kto zapłacił i kto wciąż czeka na miejsce w autokarze.'
    point:
      1: 'Przyznawaj miejsca automatycznie albo najpierw sprawdź każde zgłoszenie'
      2: 'Zapisany szablon tabeli dla każdej naprawdę potrzebnej listy'
      3: 'Kolumny, które dobrze wyglądają: flagi krajów, daty, wiek, pliki, statusy'
      4: 'Dodawaj własne kolumny i wpisuj notatki prosto do komórki'
      5: 'Szukanie, sortowanie i filtrowanie po statusie, grupie lub dowolnej odpowiedzi'
      6: 'Otwórz zgłoszenie, aby przeczytać je w całości, poprawić odpowiedź lub wpuścić kogoś z listy oczekujących'
      7: 'Gotowe do druku układy do segregatora zabieranego na miejsce'
  emails:
    title: 'E-maile, które wysyłają się same'
    text: 'Potwierdzenia, akceptacje i wiadomości o liście oczekujących wychodzą automatycznie — Twoimi słowami i w języku zgłaszającego.'
    detail: 'Każde wydarzenie ma własny zestaw szablonów, wyzwalanych tym, co dzieje się ze zgłoszeniem. Napisz je raz, ze znacznikami na imiona, daty i odpowiedzi, trzymaj wersję na język, a kolejka dostarczy je w tle, gdy Ty pracujesz dalej.'
    point:
      1: 'Szablony na zgłoszenie, akceptację, listę oczekujących i wejście z listy'
      2: 'Znaczniki podstawiają imiona, daty i dowolną odpowiedź z formularza'
      3: 'Jedna wersja na język — każdy czyta swoją'
      4: 'Wysyłane i ponawiane w tle, ze statusem doręczenia'
  dashboard:
    title: 'Całe wydarzenie na jednym ekranie'
    text: 'Liczba miejsc, zgłoszenia oczekujące, lista rezerwowa i zespół na pierwszy rzut oka — plus dane, o które zawsze pytają.'
    detail: 'Panel zaczyna się od liczb, które padają na każdym spotkaniu: ile osób jest, ile czeka, ilu opiekunów. Poniżej eksplorator demograficzny rozbija zgłoszenia według wieku, płci lub kraju, a najbliższe zadania stoją tuż obok.'
    point:
      1: 'Aktualne liczby zaakceptowanych, oczekujących, rezerwowych i zespołu'
      2: 'Eksplorator demograficzny według wieku, płci i kraju'
      3: 'Podział na kraje dla wydarzeń międzynarodowych'
      4: 'Najbliższe zadania i skróty do każdego planera'
  rooms:
    title: 'Planer pokoi i łóżek'
    text: 'Rozplanuj pokoje i łóżka, a potem je zapełnij — bez przypadkowego mieszania płci ani ról.'
    detail: 'Każdy pokój ma osobno nazwane łóżka, a planer podpowiada tylko osoby, które naprawdę pasują — do płci pokoju i domyślnie z rozdzieleniem uczestników od kadry. Zajętość jest widoczna na bieżąco, więc widzisz ostatnie wolne łóżko, zanim je komuś obiecasz.'
    point:
      1: 'Pokoje z osobno nazwanymi łóżkami'
      2: 'Podpowiedzi filtrowane według płci i roli'
      3: 'Zajętość na żywo i lista osób wciąż bez łóżka'
      4: 'Pokój i łóżko dostępne jako kolumny na listach zgłoszeń'
      5: 'Kolejność pokoi taka jak w prawdziwym budynku'
  team:
    title: 'Twój zespół z dokładnie właściwym dostępem'
    text: 'Zapraszaj koordynatorów i opiekunów e-mailem i daj każdemu tylko te uprawnienia, których wymaga jego zadanie.'
    detail: 'Dostęp przyznaje się na wydarzenie i na obszar: ktoś może planować program albo prowadzić grafik dyżurów, nie mogąc tknąć listy uczestników, albo czytać tę listę bez możliwości jej zmiany. Zaproszenia działają, zanim dana osoba ma konto, a dostęp może wygasnąć po zakończeniu wydarzenia.'
    point:
      1: 'Zaproszenie e-mailem — konto powstaje przy jego przyjęciu'
      2: 'Precyzyjne uprawnienia na obszar, a nie jeden zgrubny przełącznik admina'
      3: 'Dostęp, który wygasa automatycznie po wydarzeniu'
      4: 'Wszyscy widzą zmiany innych na żywo, bez przeładowania'
  program:
    title: 'Planer programu'
    text: 'Ułóż tydzień przeciąganiem — z planem A i B na pogodę, backlogiem na luźne pomysły i kalendarzem do wydruku.'
    detail: 'Punkty programu leżą na siatce dni od przyjazdu do wyjazdu, a Ty przeciągasz je na miejsce. Każdy punkt należy do planu A, planu B albo do obu — plan na deszcz leży gotowy obok programu na słońce, albo dwie połowy grupy idą osobno. Pomysły bez terminu czekają w backlogu, aż przeciągniesz je na konkretny dzień, a każdy tytuł, opis i miejsce ma własne tłumaczenia.'
    point:
      1: 'Siatka dzień po dniu, od przyjazdu do wyjazdu, wypełniana przeciąganiem'
      2: 'Plan A i plan B obok siebie — dobra i zła pogoda albo podzielona grupa'
      3: 'Backlog na pomysły, które chcesz odłożyć teraz i wstawić później'
      4: 'Tytuły, opisy i miejsca do przetłumaczenia — międzynarodowy zespół czyta plan we własnym języku'
      5: 'Cały zespół planuje w tym samym widoku'
      6: 'Kalendarz do wydruku na tablicę ogłoszeń'
  messages:
    title: 'Pisz dokładnie do właściwych osób'
    text: 'Wybierz grupę, nie adresy. Nikogo nie kopiujesz ręcznie i nikogo nie pomijasz.'
    detail: 'Odbiorców wybierasz po tym, kim są — wszyscy przyjęci, wszyscy oczekujący, opiekunowie, jeden kraj — a adresy dołączają same. Nic do przepisywania z arkusza, żadnego adresu wklejonego w złe miejsce, nikogo po cichu pominiętego. Załączniki idą razem z wiadomością, a każda zostaje w historii.'
    point:
      1: 'Wybierz grupę, a nie listę adresów'
      2: 'Osobiste znaczniki i załączniki plikowe'
      3: 'Pełna historia wysyłek — każdą wiadomość użyjesz jako szablonu'
  newsletters:
    title: 'Newsletter poza pojedynczym wydarzeniem'
    text: 'Prowadź własną listę subskrybentów, niezależną od wydarzeń, i pisz do niej, gdy tylko są nowości.'
    detail: 'Newsletter to osobny byt: człowiek zapisuje się raz i pozostaje osiągalny między wydarzeniami. Napisz, załącz, wyślij — a stare wydanie wykorzystaj jako punkt wyjścia dla następnego. Każda wiadomość niesie link do wypisu jednym kliknięciem, więc lista sama się czyści.'
    point:
      1: 'Lista subskrybentów, która przetrwa każde pojedyncze wydarzenie'
      2: 'Dowolne wysłane wydanie użyjesz ponownie jako szablon'
      3: 'Link do wypisania jednym kliknięciem w każdej wiadomości'
  tasks:
    title: 'Wspólna lista zadań'
    text: 'Miej pod kontrolą, co zostało do zrobienia, kto to robi i co jest po terminie — bez sięgania po drugie narzędzie.'
    detail: 'Zadania należą do wydarzenia, a nie do czyjejś prywatnej skrzynki. Przypisz je z terminem albo zostaw otwarte dla tego, kto pierwszy znajdzie czas, przefiltruj do swoich i sprawdź najbliższe terminy wprost na panelu.'
    point:
      1: 'Przypisz zadanie z terminem albo zostaw je otwarte dla chętnych'
      2: 'Filtruj po swoich, nieprzypisanych lub już ukończonych'
      3: 'Zadania na dziś pojawiają się na panelu wydarzenia'
  chores:
    title: 'Grafik dyżurów'
    text: 'Rozdzielaj po kolei dyżur kuchenny, zmywanie i wszystko inne, do czego nikt się nie zgłasza — sprawiedliwie, bez liczenia na własną rękę.'
    detail: 'Zdefiniuj dyżury, które naprawdę u was istnieją, a potem przydzielaj je dzień po dniu. Zamiast kazać Ci zgadywać, planer podpowiada, kto jest następny — pojedyncze osoby albo cały pokój naraz — i na górze stawia tych, którzy mieli najmniej dyżurów i najdawniej. Pełna historia natychmiast kończy spór „przecież my byliśmy ostatnio”.'
    point:
      1: 'Zdefiniuj własne powtarzalne dyżury — kuchnia, zmywanie, cokolwiek'
      2: 'Przydzielaj na każdy dzień, nadchodzące na wierzchu'
      3: 'Podpowiedzi, kto jest następny — pojedyncze osoby albo cały pokój'
      4: 'Sprawiedliwość wbudowana: najpierw najmniej dyżurów, potem kto czeka najdłużej'
      5: 'Pełna historia tego, kto już miał swoją kolej'
  files:
    title: 'Dokumenty w jednym miejscu'
    text: 'Wgraj formularze i ulotki informacyjne swojego wydarzenia, udostępniaj je linkiem i sprawdzaj, których jeszcze brakuje.'
    detail: 'Każde wydarzenie ma swoją półkę z dokumentami: lista rzeczy do spakowania, formularz medyczny, plan autokaru. Pliki przesłane razem ze zgłoszeniem zostają przy nim, a widok brakujących dokumentów mówi, czyje papiery wciąż zalegają — zanim ruszysz ich szukać.'
    point:
      1: 'Wgrywaj, podmieniaj i udostępniaj dokumenty linkiem'
      2: 'Pliki przesłane ze zgłoszeniem zostają przy nim'
      3: 'Lista brakujących dokumentów — nic nie jest pilnowane z pamięci'
  directory:
    title: 'Publiczna strona dla każdego wydarzenia'
    text: 'Wydarzenia oznaczone jako publiczne trafiają do przeszukiwalnego katalogu z terminami, miejscem i linkiem do zapisów.'
    detail: 'Dla każdego wydarzenia sam decydujesz, czy jest publikowane. Publikowane trafiają do katalogu, gdzie szuka się po nazwie i filtruje po zakresie dat i kraju, a dalej otwiera się strona ze wszystkimi szczegółami i formularzem zapisów — na żadnym etapie bez konta.'
    point:
      1: 'Szukanie i filtrowanie po nazwie, zakresie dat i kraju'
      2: 'Publiczna strona z terminami, miejscem, ceną i przedziałem wieku'
      3: 'Publiczne lub nie — albo po prostu udostępnij link prywatnie'
  organizations:
    title: 'Zbudowane dla organizacji, nie dla jednej osoby'
    text: 'Wydarzenia i newslettery należą do Twojej organizacji — z własnymi członkami, przeglądem i weryfikacją.'
    detail: 'Organizacja jest właścicielem swoich wydarzeń i newsletterów, więc nic nie wisi na loginie jednej osoby. Do organizacji dołącza się jako członek, a prowadzenie konkretnego wydarzenia nadal przyznaje się osobno — dzięki temu dane uczestników pozostają poza zasięgiem tych, którzy administrują tylko organizacją.'
    point:
      1: 'Wydarzenia i newslettery należą do organizacji, nie do osoby'
      2: 'Członkowie i administratorzy z przeglądem całej organizacji'
      3: 'Weryfikacja, zanim wydarzenie stanie się publiczne lub wyjdzie newsletter'
  privacy:
    title: 'Uporządkowane miejsce na informację o prywatności'
    text: 'Zapisz, co zbierasz i po co, w duchu art. 13 RODO, i daj zgłaszającym trwały link do tego tekstu.'
    detail: 'Twoja organizacja pisze bazową informację — cele, kategorie danych, odbiorców, okresy przechowywania — a każde wydarzenie dokłada tylko to, co dla niego szczególne: przewoźnika tego sezonu, ubezpieczyciela tego roku, zdjęcia, które zamierzacie opublikować. Zgłaszający sięgają po połączony tekst pod trwałym adresem, podlinkowanym w e-mailu potwierdzającym. @:app_name nadaje mu strukturę i stałe miejsce; co się w nim znajdzie i czy jest kompletny oraz poprawny, pozostaje Twoją decyzją.'
    point:
      1: 'Pola na cele, kategorie danych, odbiorców i okresy przechowywania'
      2: 'Jedna baza organizacji, przy wydarzeniu uzupełniana, a nie zastępowana'
      3: 'Trwała strona prywatności, do której można wrócić'
      4: 'Osobne miejsce na dane szczególnych kategorii i ich podstawę prawną'
</i18n>

<i18n lang="yaml" locale="cs">
eyebrow: 'Pro organizátory'
title: 'Vše, co akce potřebuje, na jednom místě'
subtitle: 'Všechno, co nahradí tabulku, papírové formuláře i nekonečný e-mailový řetěz. Otevřete kteroukoli kartu a uvidíte, jak to funguje.'
filter_label: 'Filtrovat funkce podle oblasti'
card_action: 'Detaily'
extras_label: 'A navíc:'
category:
  all: 'Vše'
  registration: 'Registrace'
  planning: 'Plánování'
  communication: 'Komunikace'
  trust: 'Tým a důvěra'
extra:
  realtime: 'Živé aktualizace pro celý tým'
  languages: 'Pět jazyků rozhraní'
  multilingual_forms: 'Vícejazyčné formuláře a e-maily'
  mobile: 'Funguje na mobilu i počítači'
  waitlist: 'Automatické čekací listiny'
  limits: 'Limity kapacity a věku'
  window: 'Začátek a konec registrací'
  print: 'Tiskové sestavy seznamů a kalendáře'
  navigation: 'Skryjte funkce, které akce nepotřebuje'
  two_factor: 'Dvoufaktorové ověření'
  dark_mode: 'Tmavý režim'
  self_host: 'Vlastní hosting s Dockerem'
feature:
  forms:
    title: 'Ptejte se přesně na to, co potřebujete vědět'
    text: 'Sestavte si vlastní registrační formulář — vaše otázky, vaše formulace, v každém jazyce, který nabízíte.'
    detail: 'Přetáhněte dovnitř otázky, které potřebujete, a ostatní vynechte. Otázka může zůstat skrytá, dokud si ji dřívější odpověď nevyžádá — nikdo se tak neprobírá poli, která se ho netýkají. Nastavte datum otevření a datum uzavření a dál to běží samo.'
    point:
      1: 'Vaše otázky, vaše formulace, na tolika stránkách, kolik chcete'
      2: 'Otázky, které se objeví, teprve když si je vyžádá dřívější odpověď'
      3: 'Opakovatelné sekce pro vícenásobné údaje — zástupci, nouzové kontakty'
      4: 'Nahrávání souborů, výběr data a země a kontroly, které zachytí překlepy'
      5: 'Dejte formuláři datum otevření a uzavření — otevře se i zavře sám'
      6: 'Přeložte každý popisek a slaďte formulář se svými barvami'
  registrations:
    title: 'Seznamy registrací, které si utvoříte sami'
    text: 'Všichni přihlášení jsou v jednom seznamu se sloupci, které jste si vybrali — připraveném k filtrování, tisku a odbavení.'
    detail: 'Rozhodněte předem, zda se místa přidělují automaticky, nebo až když si každou přihlášku přečtete. Dál je to jeden seznam: vyberete, které odpovědi se stanou sloupci a jak budou vypadat, uložíte si to jako šablonu a přepínáte mezi seznamem příjezdů, seznamem alergií a přehledem plateb, aniž byste se dotkli dat. Vaše vlastní sloupce stojí vedle odpovědí z formuláře — tým si přímo v tabulce poznamená, kdo zaplatil nebo kdo ještě čeká na místo v autobuse.'
    point:
      1: 'Přidělujte místa automaticky, nebo si každou přihlášku nejdřív projděte'
      2: 'Uložená šablona tabulky pro každý seznam, který opravdu potřebujete'
      3: 'Sloupce, které vypadají správně: vlajky zemí, data, věk, soubory, stavy'
      4: 'Přidejte si vlastní sloupce a pište poznámky přímo do buňky'
      5: 'Hledání, řazení a filtrování podle stavu, skupiny nebo libovolné odpovědi'
      6: 'Otevřete přihlášku, přečtěte ji celou, opravte odpověď nebo někoho posuňte z čekací listiny'
      7: 'Sestavy připravené k tisku do složky, kterou berete s sebou'
  emails:
    title: 'E-maily, které se odešlou samy'
    text: 'Potvrzení, schválení i zprávy o čekací listině odcházejí automaticky — vašimi slovy a v jazyce přihlášeného.'
    detail: 'Každá akce má vlastní sadu šablon spouštěných tím, co se s registrací stane. Napište je jednou se zástupnými symboly pro jména, termíny a odpovědi, mějte verzi pro každý jazyk, a fronta je doručí na pozadí, zatímco vy pracujete dál.'
    point:
      1: 'Šablony pro podání, schválení, čekací listinu i posun z ní'
      2: 'Zástupné symboly doplní jména, termíny a jakoukoli odpověď z formuláře'
      3: 'Jedna verze na jazyk — každý čte tu svou'
      4: 'Odesílání a opakování na pozadí, se stavem doručení'
  dashboard:
    title: 'Celá akce na jedné obrazovce'
    text: 'Kapacita, čekající registrace, náhradníci a tým na první pohled — a k tomu čísla, na která se vás pořád ptají.'
    detail: 'Přehled začíná čísly, která padnou na každé poradě: kolik lidí je přihlášeno, kolik čeká, kolik je vedoucích. Pod nimi průzkumník demografie rozpadá registrace podle věku, pohlaví nebo země a hned vedle stojí nejbližší úkoly.'
    point:
      1: 'Aktuální počty přijatých, čekajících, náhradníků a týmu'
      2: 'Průzkumník demografie podle věku, pohlaví a země'
      3: 'Rozpad podle zemí pro mezinárodní akce'
      4: 'Nejbližší úkoly a zkratky do všech plánovačů'
  rooms:
    title: 'Plánovač pokojů a lůžek'
    text: 'Rozvrhněte pokoje a lůžka a pak je zaplňte, aniž byste omylem smíchali pohlaví nebo role.'
    detail: 'Každý pokoj má jednotlivě pojmenovaná lůžka a plánovač nabízí jen lidi, kteří se tam skutečně hodí — podle pohlaví pokoje a ve výchozím nastavení odděleně účastníky a tým. Obsazenost zůstává na očích, takže poslední volné lůžko uvidíte dřív, než ho někomu slíbíte.'
    point:
      1: 'Pokoje s jednotlivě pojmenovanými lůžky'
      2: 'Návrhy filtrované podle pohlaví a role'
      3: 'Obsazenost živě — a kdo ještě čeká na lůžko'
      4: 'Pokoj a lůžko dostupné jako sloupce ve vašich seznamech registrací'
      5: 'Seřaďte pokoje tak, jak vypadá skutečná budova'
  team:
    title: 'Váš tým s přesně správným přístupem'
    text: 'Pozvěte koordinátory a vedoucí e-mailem a dejte každému jen ta oprávnění, která jejich role vyžaduje.'
    detail: 'Přístup se uděluje po akci a po oblasti: někdo může plánovat program nebo vést rozpis služeb, aniž by mohl sáhnout na seznam účastníků, nebo tento seznam číst bez možnosti jej měnit. Pozvánky fungují dřív, než má člověk účet, a přístup může po skončení akce automaticky vypršet.'
    point:
      1: 'Pozvánka e-mailem — účet vznikne při jejím přijetí'
      2: 'Jemně odstupňovaná oprávnění po oblastech, ne jeden hrubý přepínač'
      3: 'Přístup, který po akci automaticky skončí'
      4: 'Všichni vidí změny ostatních živě, bez načítání stránky'
  program:
    title: 'Plánovač programu'
    text: 'Poskládejte týden přetažením — s plánem A a B na počasí, backlogem na volné nápady a kalendářem k vytištění.'
    detail: 'Body programu leží v denní mřížce od příjezdu po odjezd a přetahujete je na místo. Každý bod patří do plánu A, do plánu B nebo do obou — plán na déšť leží připravený vedle programu na slunečno, nebo jdou dvě poloviny skupiny každá jinam. Nápady bez termínu čekají v backlogu, dokud je nepřetáhnete na konkrétní den, a každý název, popis i místo nese vlastní překlady.'
    point:
      1: 'Denní mřížka od příjezdu po odjezd, plněná přetahováním'
      2: 'Plán A a plán B vedle sebe — hezky i deštivo, nebo rozdělená skupina'
      3: 'Backlog na nápady, které chcete odložit teď a zařadit později'
      4: 'Názvy, popisy a místa přeložitelné — mezinárodní tým čte plán ve svém jazyce'
      5: 'Celý tým plánuje ve stejném sdíleném pohledu'
      6: 'Tisknutelný kalendář na nástěnku'
  messages:
    title: 'Pište přesně těm správným lidem'
    text: 'Vyberte skupinu, ne adresy. Nikoho nepřepisujete ručně a na nikoho nezapomenete.'
    detail: 'Příjemce vybíráte podle toho, kdo jsou — všichni přijatí, všichni čekající, vedoucí, jedna země — a adresy se přidají samy. Nic se nepřepisuje z tabulky, žádná adresa nespadne na špatný řádek, nikdo tiše nevypadne. Přílohy jdou se zprávou a každá zůstane v historii.'
    point:
      1: 'Vyberte skupinu, ne seznam adres'
      2: 'Osobní zástupné symboly a přílohy'
      3: 'Úplná historie odeslaného — každou zprávu použijete jako šablonu'
  newsletters:
    title: 'Newsletter přesahující jednu akci'
    text: 'Veďte si vlastní seznam odběratelů nezávislý na akcích a pište mu, kdykoli je co nového.'
    detail: 'Newsletter je samostatná věc: člověk se přihlásí jednou a zůstane dosažitelný i mezi akcemi. Napsat, přiložit, odeslat — a staré číslo použít jako základ pro další. Každý e-mail nese odkaz k odhlášení na jedno kliknutí, takže se seznam udržuje čistý sám.'
    point:
      1: 'Seznam odběratelů, který přetrvá jednotlivé akce'
      2: 'Kterékoli odeslané číslo znovu použijete jako šablonu'
      3: 'Odkaz k odhlášení na jedno kliknutí v každém e-mailu'
  tasks:
    title: 'Sdílený seznam úkolů'
    text: 'Mějte přehled, co zbývá udělat, kdo to dělá a co je po termínu — bez sahání po druhém nástroji.'
    detail: 'Úkoly patří k akci, ne do něčí soukromé schránky. Přiřaďte je s termínem, nebo je nechte otevřené pro toho, kdo se k nim dostane první, vyfiltrujte si vlastní a nejbližší termíny uvidíte rovnou v přehledu.'
    point:
      1: 'Úkol přiřaďte s termínem, nebo ho nechte volný, ať si ho někdo vezme'
      2: 'Filtrujte podle vlastních, nepřiřazených nebo hotových'
      3: 'Úkoly před termínem se objeví v přehledu akce'
  chores:
    title: 'Rozpis služeb'
    text: 'Střídejte kuchyňskou službu, mytí nádobí a všechno další, do čeho se nikomu nechce — spravedlivě a bez toho, abyste si to museli hlídat sami.'
    detail: 'Nadefinujte služby, které u vás opravdu existují, a pak je den po dni přiřazujte. Místo hádání plánovač navrhne, kdo je na řadě — jednotlivé lidi, nebo rovnou celý pokoj — a nahoru dá ty, kdo měli nejméně služeb a nejdéle nebyli na řadě. Úplná historie ukončí spor „vždyť jsme byli minule my“ na místě.'
    point:
      1: 'Nadefinujte si vlastní opakující se služby — kuchyň, nádobí, cokoli'
      2: 'Přiřazujte po dnech, nejbližší služby vepředu'
      3: 'Návrhy, kdo je na řadě — jednotliví lidé, nebo celý pokoj'
      4: 'Spravedlnost je součástí: nejdřív nejméně služeb, pak kdo čeká nejdéle'
      5: 'Úplná historie toho, kdo už byl na řadě'
  files:
    title: 'Dokumenty na jednom místě'
    text: 'Nahrajte formuláře a informační listy své akce, sdílejte je odkazem a sledujte, které ještě chybí.'
    detail: 'Každá akce má svou polici s dokumenty: seznam věcí na sbalení, zdravotní formulář, plán autobusu. Soubory přiložené k registraci zůstávají u ní a přehled chybějících dokumentů řekne, čí papíry ještě scházejí — dřív, než je začnete hledat.'
    point:
      1: 'Nahrávejte, nahrazujte a sdílejte dokumenty odkazem'
      2: 'Soubory poslané s registrací zůstávají u ní'
      3: 'Seznam chybějících dokumentů — nic se nehlídá z hlavy'
  directory:
    title: 'Veřejná stránka pro každou akci'
    text: 'Zveřejněné akce se objeví v prohledávatelném katalogu s termíny, místem a přímým odkazem na přihlášku.'
    detail: 'U každé akce sami rozhodnete, zda je zveřejněná. Zveřejněné se objeví ve veřejném katalogu, kde se hledá podle názvu a filtruje podle rozmezí dat a země; za tím je stránka se všemi podrobnostmi a přihláškou — a nikde po cestě není potřeba účet.'
    point:
      1: 'Hledání a filtrování podle názvu, rozmezí dat a země'
      2: 'Veřejná stránka s termíny, místem, cenou a věkovým rozmezím'
      3: 'Zveřejněná, nebo ne — případně odkaz sdílený jen soukromě'
  organizations:
    title: 'Postaveno pro organizaci, ne pro jednoho člověka'
    text: 'Akce a newslettery patří vaší organizaci — s vlastními členy, přehledem a ověřením.'
    detail: 'Organizace vlastní své akce i newslettery, takže nic nevisí na přihlášení jediného člověka. Do organizace se vstupuje jako člen, zatímco vedení konkrétní akce se stále uděluje zvlášť — díky tomu zůstávají data účastníků mimo dosah těch, kdo spravují jen organizaci.'
    point:
      1: 'Akce a newslettery vlastní organizace, ne jednotlivec'
      2: 'Členové a správci s přehledem za celou organizaci'
      3: 'Ověření dřív, než akce zveřejní nebo newsletter odejde'
  privacy:
    title: 'Uspořádané místo pro informace o zpracování'
    text: 'Zapište, co sbíráte a proč, v duchu čl. 13 GDPR, a dejte přihlášeným trvalý odkaz na ten text.'
    detail: 'Vaše organizace sepíše základní text — účely, kategorie údajů, příjemce, doby uchování — a každá akce k němu doplní jen to, co je pro ni zvláštní: dopravce této sezóny, letošního pojistitele, fotky, které chcete zveřejnit. Přihlášení najdou spojený text na trvalé adrese, odkázané z potvrzovacího e-mailu. @:app_name mu dává strukturu a stálé místo; co v něm stojí a zda je úplný a správný, zůstává na vás.'
    point:
      1: 'Pole pro účely, kategorie údajů, příjemce a doby uchování'
      2: 'Jeden základ organizace, u akce doplněný, ne nahrazený'
      3: 'Trvalá stránka o soukromí, na kterou se dá vrátit'
      4: 'Samostatné místo pro zvláštní kategorie údajů a jejich právní základ'
</i18n>
