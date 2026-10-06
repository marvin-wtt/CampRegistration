<template>
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <!-- Each data card renders its own skeleton while `loading`. -->
    <div class="dashboard-shell col-12 col-md-11 col-xl-10">
      <event-summary-header :loading>
        <template
          v-if="
            quasar.screen.lt.sm && (shortcutsLoading || quickActions.length > 0)
          "
          #actions
        >
          <template v-if="shortcutsLoading">
            <q-skeleton
              v-for="width in ['132px', '152px', '116px', '104px']"
              :key="width"
              type="QBtn"
              class="shortcut-skeleton"
            />
          </template>
          <template v-else>
            <m-btn
              v-for="action in quickActions"
              :key="action.key"
              :label="action.label"
              :icon="action.icon"
              :to="{ name: action.route }"
              secondary
              tonal
              no-caps
            />
          </template>
        </template>
      </event-summary-header>

      <!-- The most consequential thing a manager can be unaware of: the event is
       configured correctly but reaching nobody. -->
      <organization-unverified-notice
        v-if="event"
        subject="event"
        :organization-id="event.organizationId"
        :organization-name="event.organizationName"
        :verification-status="event.organizationVerificationStatus"
      />

      <!-- Wide screens: the phase's main cards on the left, things to do on the
           right. Narrow screens: one column in the layout's order. -->
      <div
        class="dashboard-columns"
        :class="{ 'dashboard-columns--single': sideCards.length === 0 }"
      >
        <div
          v-for="column in columns"
          :key="column.name"
          class="dashboard-column"
          :class="`dashboard-column--${column.name}`"
        >
          <template
            v-for="card in column.cards"
            :key="card.key"
          >
            <setup-checklist-card
              v-if="card.key === 'setup' && event"
              :event
              :style="card.style"
            />
            <attention-card
              v-else-if="card.key === 'attention'"
              :phase
              :loading
              :rooms="features.rooms"
              :style="card.style"
            />
            <tasks-card
              v-else-if="card.key === 'tasks'"
              :loading="taskStore.isLoading"
              :style="card.style"
            />
            <today-program-card
              v-else-if="card.key === 'program' && event"
              :event
              :style="card.style"
            />
            <today-duties-card
              v-else-if="card.key === 'duties' && event"
              :event
              :style="card.style"
            />
            <registration-overview-card
              v-else-if="card.key === 'registrations'"
              :loading
              :style="card.style"
            />
            <readiness-card
              v-else-if="card.key === 'readiness' && event"
              :event
              :loading
              :rooms="features.rooms"
              :program="features.program"
              :style="card.style"
            />
            <demographics-card
              v-else-if="card.key === 'demographics'"
              :people="stats.acceptedParticipants.value"
              :loading
              :style="card.style"
            />
          </template>
        </div>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import EventSummaryHeader from '@/components/event/dashboard/EventSummaryHeader.vue';
import AttentionCard from '@/components/event/dashboard/AttentionCard.vue';
import TasksCard from '@/components/event/dashboard/TasksCard.vue';
import SetupChecklistCard from '@/components/event/dashboard/SetupChecklistCard.vue';
import TodayProgramCard from '@/components/event/dashboard/TodayProgramCard.vue';
import TodayDutiesCard from '@/components/event/dashboard/TodayDutiesCard.vue';
import RegistrationOverviewCard from '@/components/event/dashboard/RegistrationOverviewCard.vue';
import ReadinessCard from '@/components/event/dashboard/ReadinessCard.vue';
import DemographicsCard from '@/components/event/dashboard/DemographicsCard.vue';
import OrganizationUnverifiedNotice from '@/components/organization/OrganizationUnverifiedNotice.vue';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useProfileStore } from '@/stores/profile-store';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useEventFilesStore } from '@/stores/event-files-store';
import { useTaskStore } from '@/stores/task-store';
import { useProgramPlannerStore } from '@/stores/program-planner-store';
import { useProgramPublishedDayStore } from '@/stores/program-published-day-store';
import { useChoreStore } from '@/stores/chore-store';
import { useChoreAssignmentStore } from '@/stores/chore-assignment-store';
import { useEventStatistics } from '@/composables/eventStatistics';
import { usePermissions } from '@/composables/permissions';
import { useNavigationSettings } from '@/composables/eventNavigationSettings';
import { type EventPhase, useEventPhase } from '@/composables/eventPhase';
import type { PermissionRequirement } from '@/composables/scopePermissions';
import type { HideableNavigationItem } from '@camp-registration/common/settings';

type CardKey =
  | 'setup'
  | 'attention'
  | 'tasks'
  | 'program'
  | 'duties'
  | 'registrations'
  | 'readiness'
  | 'demographics';

type Column = 'main' | 'side';

// Ordered by priority, which is also the order on narrow screens. Detected
// issues always lead.
const LAYOUTS: Record<EventPhase, [CardKey, Column][]> = {
  setup: [
    ['attention', 'side'],
    ['setup', 'main'],
    ['tasks', 'side'],
    ['registrations', 'main'],
  ],
  registration: [
    ['attention', 'side'],
    ['tasks', 'side'],
    ['registrations', 'main'],
    ['demographics', 'main'],
  ],
  preparation: [
    ['attention', 'side'],
    ['tasks', 'side'],
    ['registrations', 'main'],
    ['readiness', 'side'],
    ['demographics', 'main'],
  ],
  running: [
    ['attention', 'side'],
    ['program', 'main'],
    ['duties', 'side'],
    ['tasks', 'side'],
    ['registrations', 'main'],
    ['demographics', 'main'],
  ],
  wrapUp: [
    ['attention', 'side'],
    ['tasks', 'side'],
    ['registrations', 'main'],
    ['demographics', 'main'],
  ],
};

const { t } = useI18n();
const quasar = useQuasar();

const eventDetailsStore = useEventDetailsStore();
const profileStore = useProfileStore();
const registrationStore = useRegistrationsStore();
const eventFilesStore = useEventFilesStore();
const taskStore = useTaskStore();
const programStore = useProgramPlannerStore();
const publishedDayStore = useProgramPublishedDayStore();
const choreStore = useChoreStore();
const choreAssignmentStore = useChoreAssignmentStore();
const stats = useEventStatistics();
const { can, canAccess } = usePermissions();
const { settings: navigationSettings, isLoading: navigationLoading } =
  useNavigationSettings();
const { viewedPhase } = useEventPhase();

// Features hidden from the nav rail are hidden here too.
function isShown(item: HideableNavigationItem): boolean {
  return !navigationSettings.hiddenItems.includes(item);
}

const {
  data: event,
  isLoading: eventLoading,
  error: eventError,
} = storeToRefs(eventDetailsStore);
const { isLoading: registrationsLoading, error: registrationsError } =
  storeToRefs(registrationStore);

const loading = computed<boolean>(
  () => registrationsLoading.value || eventLoading.value,
);

const error = computed<string | null>(
  () => eventError.value ?? registrationsError.value,
);

const features = computed(() => ({
  tasks: can('event.tasks.view') && isShown('tasks'),
  duties:
    can('event.chore_assignments.view') &&
    can('event.chores.view') &&
    isShown('chore_planner'),
  program: can('event.program_items.view') && isShown('program_planner'),
  rooms: can('event.rooms.view') && isShown('room_planner'),
}));

// Started during setup, not awaited: the stores flag themselves loading before
// the first render, so the page renders its skeletons instead of an idle frame.
// Tasks are optional to the dashboard: a failed fetch leaves them out.
void registrationStore.fetchData();
void eventDetailsStore.fetchData();
void eventFilesStore.fetchData();
void taskStore.fetchData();
watch(
  features,
  ({ program, duties }) => {
    if (program) {
      void programStore.fetchData();
      void publishedDayStore.fetchData();
    }
    if (duties) {
      void choreStore.fetchData();
      void choreAssignmentStore.fetchData();
    }
  },
  { immediate: true },
);

// Before the event has loaded the registration layout stands in.
const phase = computed<EventPhase>(() => viewedPhase.value ?? 'registration');

function isAvailable(key: CardKey): boolean {
  switch (key) {
    case 'tasks':
      return features.value.tasks;
    case 'program':
      return features.value.program;
    case 'duties':
      return features.value.duties;
    case 'readiness':
      return features.value.rooms || features.value.program;
    default:
      return true;
  }
}

const cards = computed(() =>
  LAYOUTS[phase.value]
    .filter(([key]) => isAvailable(key))
    .map(([key, column], index) => ({
      key,
      column,
      // Takes effect where the columns dissolve on narrow screens.
      style: { order: index },
    })),
);

const sideCards = computed(() =>
  cards.value.filter((card) => card.column === 'side'),
);

const columns = computed<{ name: Column; cards: typeof cards.value }[]>(() => [
  {
    name: 'main',
    cards: cards.value.filter((card) => card.column === 'main'),
  },
  { name: 'side', cards: sideCards.value },
]);

// Shortcuts depend on permissions (profile and event) and the hidden nav items;
// most managers have some, so they are skeletonized rather than left out.
const shortcutsLoading = computed<boolean>(
  () =>
    navigationLoading.value ||
    profileStore.user === undefined ||
    event.value === undefined,
);

interface QuickAction {
  key: string;
  label: string;
  icon: string;
  route: string;
  permission: PermissionRequirement<'event'>;
  navItem?: HideableNavigationItem;
}

const quickActions = computed<QuickAction[]>(() =>
  (
    [
      {
        key: 'participants',
        label: t('actions.participants'),
        icon: 'groups',
        route: 'management.event.participants',
        permission: 'event.registrations.view',
      },
      {
        key: 'contact',
        label: t('actions.contact'),
        icon: 'mark_email_unread',
        route: 'management.event.contact',
        navItem: 'contact',
        permission: { any: ['event.messages.create', 'event.messages.view'] },
      },
      {
        key: 'program',
        label: t('actions.program'),
        icon: 'calendar_month',
        route: 'management.event.program-planner',
        navItem: 'program_planner',
        permission: 'event.program_items.view',
      },
      {
        key: 'duties',
        label: t('actions.duties'),
        icon: 'cleaning_services',
        route: 'management.event.chore-planner',
        navItem: 'chore_planner',
        permission: {
          all: ['event.chore_assignments.view', 'event.chores.view'],
        },
      },
    ] satisfies QuickAction[]
  ).filter(
    (action) =>
      canAccess(action.permission) &&
      (!action.navItem || isShown(action.navItem)),
  ),
);
</script>

<style scoped>
.shortcut-skeleton {
  height: 40px;
  border-radius: 999px;
}

.dashboard-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1440px;
}

.dashboard-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
}

/* Single column: the wrappers dissolve so the cards follow their `order`. */
.dashboard-column {
  display: contents;
}

@media (min-width: 1280px) {
  .dashboard-columns {
    grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
    align-items: start;
  }

  .dashboard-column {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 20px;
  }

  /* Nothing on the side: the main column takes the width. */
  .dashboard-columns--single {
    grid-template-columns: minmax(0, 1fr);
  }

  .dashboard-columns--single .dashboard-column--side {
    display: none;
  }
}

@media (max-width: 599px) {
  .dashboard-shell,
  .dashboard-columns {
    gap: 16px;
  }
}
</style>

<i18n lang="yaml" locale="en">
actions:
  participants: 'Participants'
  contact: 'Communication'
  program: 'Program'
  duties: 'Duties'
</i18n>

<i18n lang="yaml" locale="de">
actions:
  participants: 'Teilnehmende'
  contact: 'Kommunikation'
  program: 'Programm'
  duties: 'Dienste'
</i18n>

<i18n lang="yaml" locale="fr">
actions:
  participants: 'Participants'
  contact: 'Communication'
  program: 'Programme'
  duties: 'Corvées'
</i18n>

<i18n lang="yaml" locale="pl">
actions:
  participants: 'Uczestnicy'
  contact: 'Komunikacja'
  program: 'Program'
  duties: 'Dyżury'
</i18n>

<i18n lang="yaml" locale="cs">
actions:
  participants: 'Účastníci'
  contact: 'Komunikace'
  program: 'Program'
  duties: 'Služby'
</i18n>
