<template>
  <!-- Loading is handled with skeleton loading -->
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <div class="event-mgmt col-12 col-md-11 col-lg-10 col-xl-8 column no-wrap">
      <page-header
        class="event-mgmt__header"
        :title="t('title')"
        :subtitle="t('subtitle')"
      >
        <template #actions>
          <q-btn
            :label="quasar.screen.gt.xs ? t('action.create') : ''"
            :aria-label="t('action.create')"
            color="primary"
            icon="add"
            unelevated
            no-caps
            :round="quasar.screen.lt.sm"
            :rounded="quasar.screen.gt.xs"
            data-test="event-create"
            @click="onCreateEvent()"
          />
        </template>
      </page-header>

      <!-- Loading -->
      <div
        v-if="loading"
        class="results-grid"
      >
        <event-card-skeleton
          v-for="index in 6"
          :key="index"
        />
      </div>

      <!-- Empty -->
      <div
        v-else-if="totalEvents === 0"
        class="event-mgmt__empty column items-center justify-center"
      >
        <q-icon
          name="cabin"
          size="64px"
          class="event-mgmt__empty-icon"
        />
        <div class="text-h6 q-mt-md">
          {{ t('empty.title') }}
        </div>
        <div class="event-mgmt__subtitle text-body2 q-mt-xs text-center">
          {{ t('empty.message') }}
        </div>
        <q-btn
          class="q-mt-lg"
          :label="t('action.create')"
          color="primary"
          icon="add"
          unelevated
          no-caps
          rounded
          @click="onCreateEvent()"
        />
      </div>

      <!-- Timeline groups -->
      <template v-else>
        <event-card-section
          v-for="group in groups"
          :key="group.key"
          :header="group.header"
          :icon="group.icon"
          :events="group.events"
        />

        <event-card-section
          v-if="archivedEvents.length"
          :header="t('group.archived')"
          icon="inventory_2"
          :hint="t('group.archivedHint')"
          :events="archivedEvents"
          collapsible
        />
      </template>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageHeader from '@/components/common/PageHeader.vue';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import type { Event } from '@camp-registration/common/entities';
import { useAssignedEventsStore } from '@/stores/assigned-events-store';
import { storeToRefs } from 'pinia';
import EventCardSection from '@/components/event/index/EventCardSection.vue';
import EventCardSkeleton from '@/components/event/index/EventCardSkeleton.vue';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { isEventArchived, phaseOf, type EventPhase } from '@/utils/eventPhase';
import { useQuasar } from 'quasar';
import { useCreateEventFlow } from '@/composables/createEventFlow';

const { t } = useI18n();
const quasar = useQuasar();
const assignedEventsStore = useAssignedEventsStore();
const { createEvent } = useCreateEventFlow();

const {
  data: events,
  isLoading: loading,
  error,
} = storeToRefs(assignedEventsStore);

// Started during setup, not awaited: the stores flag themselves loading before
// the first render, so the page renders its skeletons instead of an idle frame.
void assignedEventsStore.fetchData();

const totalEvents = computed<number>(() => events.value?.length ?? 0);

interface Group {
  key: EventPhase;
  header: string;
  icon: string;
  events: Event[];
}

const groups = computed<Group[]>(() => {
  const all = (events.value ?? []).filter((event) => !isEventArchived(event));

  const ongoing = all
    .filter((event) => phaseOf(event) === 'ongoing')
    .toSorted(byStartAsc);
  const upcoming = all
    .filter((event) => phaseOf(event) === 'upcoming')
    .toSorted(byStartAsc);
  const ended = all
    .filter((event) => phaseOf(event) === 'ended')
    .toSorted(byStartDesc);

  return [
    {
      key: 'ongoing' as const,
      header: t('group.ongoing'),
      icon: 'play_circle',
      events: ongoing,
    },
    {
      key: 'upcoming' as const,
      header: t('group.upcoming'),
      icon: ' event',
      events: upcoming,
    },
    {
      key: 'ended' as const,
      header: t('group.ended'),
      icon: 'schedule',
      events: ended,
    },
  ].filter((group) => group.events.length > 0);
});

const archivedEvents = computed<Event[]>(() => {
  return (events.value ?? []).filter(isEventArchived).toSorted(byStartDesc);
});

function byStartAsc(a: Event, b: Event) {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

function byStartDesc(a: Event, b: Event) {
  return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
}

function onCreateEvent() {
  void createEvent();
}
</script>

<style scoped>
.event-mgmt {
  min-width: 0;
}

/* Clear the floating toolbar so the title isn't crowded against it */
.event-mgmt__header {
  margin-top: 1rem;
}

.event-mgmt__subtitle {
  color: var(--md3-on-surface-variant);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  align-items: stretch;

  margin-top: 28px;
}

.event-mgmt__empty {
  padding: 64px 16px;
}

.event-mgmt__empty-icon {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}
</style>

<i18n lang="yaml" locale="en">
title: 'My events'
subtitle: 'Manage registrations, rooms and program for the events you run.'
group:
  ongoing: 'Happening now'
  upcoming: 'Upcoming'
  ended: 'Ended'
  archived: 'Archived'
  archivedHint: 'Archived for every manager of the event. Archiving only tidies this list — the event keeps working as before.'
action:
  create: 'Create event'
empty:
  title: 'No events yet'
  message: 'Create your first event to start managing registrations, rooms and program.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Meine Veranstaltungen'
subtitle: 'Verwalte Anmeldungen, Räume und Programm für die Veranstaltungen, die du leitest.'
group:
  ongoing: 'Aktuell'
  upcoming: 'Anstehend'
  ended: 'Beendet'
  archived: 'Archiviert'
  archivedHint: 'Für alle Verwaltenden der Veranstaltung archiviert. Das Archivieren räumt nur diese Liste auf — die Veranstaltung funktioniert weiter wie bisher.'
action:
  create: 'Veranstaltung erstellen'
empty:
  title: 'Noch keine Veranstaltungen'
  message: 'Erstelle deine erste Veranstaltung, um Anmeldungen, Räume und Programm zu verwalten.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Mes événements'
subtitle: 'Gérez les inscriptions, les chambres et le programme des événements que vous dirigez.'
group:
  ongoing: 'En cours'
  upcoming: 'À venir'
  ended: 'Terminés'
  archived: 'Archivés'
  archivedHint: 'Archivés pour tous les gestionnaires de l’événement. L’archivage ne fait que ranger cette liste — l’événement continue de fonctionner comme avant.'
action:
  create: 'Créer un événement'
empty:
  title: 'Aucun événement pour le moment'
  message: 'Créez votre premier événement pour gérer les inscriptions, les chambres et le programme.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Moje wydarzenia'
subtitle: 'Zarządzaj zapisami, pokojami i programem wydarzeń, które prowadzisz.'
group:
  ongoing: 'Trwające'
  upcoming: 'Nadchodzące'
  ended: 'Zakończone'
  archived: 'Zarchiwizowane'
  archivedHint: 'Zarchiwizowane dla wszystkich zarządzających wydarzeniem. Archiwizacja tylko porządkuje tę listę — wydarzenie działa dalej jak dotąd.'
action:
  create: 'Utwórz wydarzenie'
empty:
  title: 'Brak wydarzeń'
  message: 'Utwórz swoje pierwsze wydarzenie, aby zarządzać zapisami, pokojami i programem.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Moje akce'
subtitle: 'Spravujte registrace, pokoje a program akcí, které vedete.'
group:
  ongoing: 'Probíhající'
  upcoming: 'Nadcházející'
  ended: 'Ukončené'
  archived: 'Archivované'
  archivedHint: 'Archivováno pro všechny správce akce. Archivace jen uklidí tento seznam — akce dál funguje jako dosud.'
action:
  create: 'Vytvořit akci'
empty:
  title: 'Zatím žádné akce'
  message: 'Vytvořte svou první akci a začněte spravovat registrace, pokoje a program.'
</i18n>
