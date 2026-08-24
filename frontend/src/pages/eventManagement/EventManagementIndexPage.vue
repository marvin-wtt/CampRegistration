<template>
  <!-- Loading is handled with skeleton loading -->
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <div class="event-mgmt col-12 col-md-11 col-lg-10 col-xl-8 column no-wrap">
      <!-- Header -->
      <div class="event-mgmt__header row items-start justify-between no-wrap">
        <div class="col page-title">
          <div class="text-h5 text-weight-medium">
            {{ t('title') }}
          </div>
          <div class="event-mgmt__subtitle text-body2 q-mt-xs">
            {{ t('subtitle') }}
          </div>
        </div>

        <q-btn
          :label="quasar.screen.gt.xs ? t('action.create') : ''"
          :aria-label="t('action.create')"
          color="primary"
          icon="add"
          unelevated
          no-caps
          :round="quasar.screen.lt.sm"
          :rounded="quasar.screen.gt.xs"
          @click="onCreateEvent()"
        />
      </div>

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
          v-if="pastEvents.length"
          :header="t('group.past')"
          icon="history"
          :hint="t('group.pastHint')"
          :events="pastEvents"
          collapsible
        />
      </template>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, onMounted } from 'vue';
import type { Event } from '@camp-registration/common/entities';
import { useAssignedEventsStore } from '@/stores/assigned-events-store';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import EventCardSection from '@/components/eventManagement/index/EventCardSection.vue';
import EventCardSkeleton from '@/components/eventManagement/index/EventCardSkeleton.vue';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import EventCreateDialog from '@/components/eventManagement/index/EventCreateDialog.vue';
import { phaseOf, type EventPhase } from '@/utils/eventPhase';
import { useRouter } from 'vue-router';
import { useOrganizationsStore } from '@/stores/organizations-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';

const { t } = useI18n();
const quasar = useQuasar();
const router = useRouter();
const assignedEventsStore = useAssignedEventsStore();
const organizationsStore = useOrganizationsStore();
const { eventCreationOrganizationIds } = useOrganizationPermissions();

const {
  data: events,
  isLoading: loading,
  error,
} = storeToRefs(assignedEventsStore);

onMounted(() => void assignedEventsStore.fetchData());

const totalEvents = computed<number>(() => events.value?.length ?? 0);

interface Group {
  key: Exclude<EventPhase, 'past'>;
  header: string;
  icon: string;
  events: Event[];
}

const groups = computed<Group[]>(() => {
  const all = events.value ?? [];

  const ongoing = all
    .filter((event) => phaseOf(event) === 'ongoing')
    .toSorted(byStartAsc);
  const upcoming = all
    .filter((event) => phaseOf(event) === 'upcoming')
    .toSorted(byStartAsc);
  const recentlyEnded = all
    .filter((event) => phaseOf(event) === 'recentlyEnded')
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
      key: 'recentlyEnded' as const,
      header: t('group.recentlyEnded'),
      icon: 'schedule',
      events: recentlyEnded,
    },
  ].filter((group) => group.events.length > 0);
});

const pastEvents = computed<Event[]>(() => {
  return (events.value ?? [])
    .filter((event) => phaseOf(event) === 'past')
    .toSorted(byStartDesc);
});

function byStartAsc(a: Event, b: Event) {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

function byStartDesc(a: Event, b: Event) {
  return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
}

async function onCreateEvent() {
  // A event must name an organization the user belongs to. Without one, send
  // them to create an organization rather than into a dialog that would 403.
  await organizationsStore.fetchData();

  if (eventCreationOrganizationIds.value.length === 0) {
    quasar
      .dialog({
        title: t('organization_required.title'),
        message: t('organization_required.message'),
        cancel: {
          outline: true,
          color: 'primary',
        },
        ok: {
          label: t('organization_required.action'),
          color: 'primary',
          rounded: true,
        },
      })
      .onOk(() => {
        void router.push({ name: 'management.organizations' });
      });
    return;
  }

  quasar.dialog({
    component: EventCreateDialog,
  });
}
</script>

<style scoped>
.event-mgmt {
  min-width: 0;
}

/* Clear the floating toolbar so the title isn't crowded against it */
.event-mgmt__header {
  gap: 16px;
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
organization_required:
  title: 'Organization required'
  message: 'Events are run by an organization. Create one first — you can start building your event right after, even before it is verified.'
  action: 'Go to organizations'
subtitle: 'Manage registrations, rooms and program for the events you run.'
group:
  ongoing: 'Happening now'
  upcoming: 'Upcoming'
  recentlyEnded: 'Recently ended'
  past: 'Past events'
  pastHint: 'Events move here automatically once they ended more than 6 weeks ago and registration is closed.'
action:
  create: 'Create event'
empty:
  title: 'No events yet'
  message: 'Create your first event to start managing registrations, rooms and program.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Meine Veranstaltungen'
organization_required:
  title: 'Organisation erforderlich'
  message: 'Veranstaltungen werden von einer Organisation betrieben. Erstelle zuerst eine — deine Veranstaltung kannst du direkt danach anlegen, auch vor der Verifizierung.'
  action: 'Zu den Organisationen'
subtitle: 'Verwalte Anmeldungen, Räume und Programm für die Veranstaltungen, die du leitest.'
group:
  ongoing: 'Aktuell'
  upcoming: 'Anstehend'
  recentlyEnded: 'Kürzlich beendet'
  past: 'Vergangene Veranstaltungen'
  pastHint: 'Veranstaltungen landen automatisch hier, wenn sie vor mehr als 6 Wochen endeten und die Anmeldung geschlossen ist.'
action:
  create: 'Veranstaltung erstellen'
empty:
  title: 'Noch keine Veranstaltungen'
  message: 'Erstelle deine erste Veranstaltung, um Anmeldungen, Räume und Programm zu verwalten.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Mes événements'
organization_required:
  title: 'Organisation requise'
  message: "Les événements sont gérés par une organisation. Crée-en une d'abord — tu pourras préparer ton événement juste après, même avant la vérification."
  action: 'Aller aux organisations'
subtitle: 'Gérez les inscriptions, les chambres et le programme des événements que vous dirigez.'
group:
  ongoing: 'En cours'
  upcoming: 'À venir'
  recentlyEnded: 'Récemment terminés'
  past: 'Événements passés'
  pastHint: 'Les événements arrivent ici automatiquement lorsqu’ils se sont terminés il y a plus de 6 semaines et que les inscriptions sont closes.'
action:
  create: 'Créer un événement'
empty:
  title: 'Aucun événement pour le moment'
  message: 'Créez votre premier événement pour gérer les inscriptions, les chambres et le programme.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Moje wydarzenia'
organization_required:
  title: 'Wymagana organizacja'
  message: 'Wydarzenia prowadzone są przez organizację. Najpierw utwórz organizację — wydarzenie możesz przygotować zaraz potem, jeszcze przed weryfikacją.'
  action: 'Przejdź do organizacji'
subtitle: 'Zarządzaj zapisami, pokojami i programem wydarzeń, które prowadzisz.'
group:
  ongoing: 'Trwające'
  upcoming: 'Nadchodzące'
  recentlyEnded: 'Niedawno zakończone'
  past: 'Minione wydarzenia'
  pastHint: 'Wydarzenia trafiają tutaj automatycznie, gdy zakończyły się ponad 6 tygodni temu, a zapisy są zamknięte.'
action:
  create: 'Utwórz wydarzenie'
empty:
  title: 'Brak wydarzeń'
  message: 'Utwórz swoje pierwsze wydarzenie, aby zarządzać zapisami, pokojami i programem.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Moje akce'
organization_required:
  title: 'Vyžadována organizace'
  message: 'Akce pořádá organizace. Nejprve nějakou vytvoř — akci můžeš připravovat hned poté, i před ověřením.'
  action: 'Přejít na organizace'
subtitle: 'Spravujte registrace, pokoje a program akcí, které vedete.'
group:
  ongoing: 'Probíhající'
  upcoming: 'Nadcházející'
  recentlyEnded: 'Nedávno ukončené'
  past: 'Minulé akce'
  pastHint: 'Akce se zde objeví automaticky, jakmile skončily před více než 6 týdny a registrace je uzavřena.'
action:
  create: 'Vytvořit akci'
empty:
  title: 'Zatím žádné akce'
  message: 'Vytvořte svou první akci a začněte spravovat registrace, pokoje a program.'
</i18n>
