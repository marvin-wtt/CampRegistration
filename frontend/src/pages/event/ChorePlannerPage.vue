<template>
  <page-state-handler
    padding
    :error
    :loading
    class="chore-planner-page row justify-center"
  >
    <div
      class="planner-content col-12 col-md-11 col-lg-10 column no-wrap q-gutter-y-md"
    >
      <page-header
        :title="t('title')"
        :subtitle="t('subtitle')"
      >
        <template #actions>
          <m-btn
            v-if="canCreate && chores.length > 0 && !quasar.screen.lt.sm"
            :label="t('action.quick')"
            icon="bolt"
            outline
            @click="openAssignmentDialog()"
          />
          <m-btn
            v-if="canCreate && chores.length > 0"
            :label="t('action.series')"
            color="primary"
            icon="event_repeat"
            @click="planSeries()"
          />
          <q-space />
          <m-btn
            icon="more_vert"
            square
            round
            text
            :aria-label="t('action.more')"
          >
            <q-menu>
              <q-list>
                <q-item
                  v-close-popup
                  clickable
                  @click="openChoreManager"
                >
                  <q-item-section avatar>
                    <q-icon name="tune" />
                  </q-item-section>
                  <q-item-section>{{ t('action.chores') }}</q-item-section>
                </q-item>
                <q-item
                  v-if="chores.length > 0"
                  v-close-popup
                  clickable
                  @click="openFairness"
                >
                  <q-item-section avatar>
                    <q-icon name="balance" />
                  </q-item-section>
                  <q-item-section>{{ t('action.fairness') }}</q-item-section>
                </q-item>
                <q-item
                  v-if="
                    can('event.chore_assignments.edit') &&
                    assignments.length > 0
                  "
                  v-close-popup
                  clickable
                  @click="removePerson()"
                >
                  <q-item-section avatar>
                    <q-icon name="person_remove" />
                  </q-item-section>
                  <q-item-section>
                    {{ t('action.removePerson') }}
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="assignments.length > 0"
                  v-close-popup
                  clickable
                  @click="print"
                >
                  <q-item-section avatar>
                    <q-icon name="print" />
                  </q-item-section>
                  <q-item-section>{{ t('action.print') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </m-btn>
        </template>
      </page-header>

      <!-- Empty state -->
      <div
        v-if="!loading && chores.length === 0"
        class="empty-state col column no-wrap items-center justify-center"
      >
        <q-icon
          name="checklist"
          size="64px"
          class="empty-icon"
        />
        <div class="text-h6 q-mt-md">
          {{ t('empty.title') }}
        </div>
        <div class="text-body2 text-grey-6 q-mt-xs text-center">
          {{ t('empty.message') }}
        </div>
        <m-btn
          v-if="can('event.chores.create')"
          class="q-mt-lg"
          :label="t('action.addChore')"
          color="primary"
          icon="add"
          @click="openChoreManager"
        />
      </div>

      <template v-else>
        <!-- View + filter -->
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-auto">
            <q-btn-toggle
              v-model="view"
              :class="{ 'full-width': quasar.screen.lt.sm }"
              class="compact-toggle"
              spread
              no-caps
              rounded
              unelevated
              toggle-color="primary"
              :options="viewOptions"
            />
          </div>
          <!-- Scrolls sideways on phones rather than wrapping into rows. -->
          <div
            v-if="chores.length > 1"
            class="col-12 col-sm"
          >
            <div class="chip-scroll row no-wrap">
              <q-chip
                v-for="chore in chores"
                :key="chore.id"
                clickable
                class="filter-chip"
                :class="{
                  'filter-chip--active': filterChoreIds.includes(chore.id),
                }"
                @click="toggleChoreFilter(chore.id)"
              >
                {{ to(chore.name) }}
              </q-chip>
            </div>
          </div>
        </div>

        <!-- Today -->
        <template v-if="view === 'today'">
          <div class="row items-center no-wrap">
            <q-btn
              icon="chevron_left"
              flat
              round
              :aria-label="t('nav.previousDay')"
              @click="day = addDays(day, -1)"
            />
            <div
              class="col text-center text-subtitle1 text-weight-medium ellipsis"
            >
              {{ dayTitle }}
            </div>
            <q-btn
              icon="chevron_right"
              flat
              round
              :aria-label="t('nav.nextDay')"
              @click="day = addDays(day, 1)"
            />
          </div>

          <div class="row items-center q-gutter-sm">
            <div class="text-caption text-grey-7">
              {{ dayAssignments.length > 0 ? daySummary : '' }}
            </div>
            <q-space />
            <q-btn
              v-if="focusDate === today && day !== today"
              :label="t('nav.today')"
              color="primary"
              flat
              rounded
              no-caps
              @click="day = today"
            />
            <q-btn
              v-if="canEdit && plannedToday.length > 0 && day <= today"
              icon="done_all"
              :label="t('action.allDone')"
              color="positive"
              outline
              rounded
              no-caps
              @click="markAllDone"
            />
          </div>

          <!-- Swipe left/right for the next/previous day. -->
          <div v-touch-swipe.horizontal="onSwipe">
            <q-card
              v-if="dayAssignments.length > 0"
              flat
              bordered
              class="rounded-xl overflow-hidden"
            >
              <q-list separator>
                <chore-assignment-card
                  v-for="assignment in dayAssignments"
                  :key="assignment.id"
                  v-bind="cardProps(assignment)"
                  v-on="cardHandlers(assignment)"
                />
              </q-list>
            </q-card>
            <div
              v-else
              class="empty-state column no-wrap items-center"
            >
              <q-icon
                name="event_available"
                size="48px"
                class="empty-icon"
              />
              <div class="text-body1 q-mt-sm">{{ t('noDuties') }}</div>
              <m-btn
                v-if="canCreate"
                class="q-mt-md"
                :label="t('action.quick')"
                icon="bolt"
                outline
                @click="openAssignmentDialog({ date: day })"
              />
            </div>
          </div>
        </template>

        <!-- Week -->
        <template v-else-if="view === 'week'">
          <div class="row items-center no-wrap">
            <q-btn
              icon="chevron_left"
              flat
              round
              :aria-label="t('nav.previousWeek')"
              @click="weekStart = addDays(weekStart, -7)"
            />
            <div
              class="col text-center text-subtitle1 text-weight-medium ellipsis"
            >
              {{ weekLabel }}
            </div>
            <q-btn
              icon="chevron_right"
              flat
              round
              :aria-label="t('nav.nextWeek')"
              @click="weekStart = addDays(weekStart, 7)"
            />
          </div>
          <div
            v-if="focusDate === today && weekStart !== mondayOf(today)"
            class="row justify-center"
          >
            <q-btn
              :label="t('nav.thisWeek')"
              color="primary"
              flat
              rounded
              no-caps
              @click="weekStart = mondayOf(today)"
            />
          </div>
          <chore-week-grid
            :chores="visibleChores"
            :assignments="filteredAssignments"
            :week-start="weekStart"
            :names="names"
            :can-create="canCreate"
            :agenda="quasar.screen.lt.md"
            :event-start="eventStart"
            :event-end="eventEnd"
            @open="editAssignment"
            @create="(target) => openAssignmentDialog(target)"
          />
        </template>

        <!-- List -->
        <template v-else>
          <div
            v-for="group in upcomingGroups"
            :key="group.date"
          >
            <div class="row items-center q-mb-xs">
              <div class="text-subtitle2 text-weight-medium">
                {{ d(parseLocalDate(group.date), 'dateFull') }}
              </div>
              <q-space />
              <q-btn
                v-if="canDelete"
                icon="more_horiz"
                flat
                round
                :aria-label="t('action.more')"
              >
                <q-menu>
                  <q-list>
                    <q-item
                      v-close-popup
                      clickable
                      @click="deleteDay(group.date)"
                    >
                      <q-item-section avatar>
                        <q-icon
                          name="delete_sweep"
                          color="negative"
                        />
                      </q-item-section>
                      <q-item-section>{{
                        t('action.deleteDay')
                      }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
            <q-card
              flat
              bordered
              class="rounded-xl overflow-hidden"
            >
              <q-list separator>
                <chore-assignment-card
                  v-for="assignment in group.items"
                  :key="assignment.id"
                  v-bind="cardProps(assignment)"
                  v-on="cardHandlers(assignment)"
                />
              </q-list>
            </q-card>
          </div>

          <div
            v-if="upcomingGroups.length === 0"
            class="empty-state column no-wrap items-center"
          >
            <q-icon
              name="event_available"
              size="48px"
              class="empty-icon"
            />
            <div class="text-body1 q-mt-sm">
              {{
                assignments.length === 0 ? t('noAssignments') : t('noUpcoming')
              }}
            </div>
            <m-btn
              v-if="canCreate"
              class="q-mt-md"
              :label="t('action.series')"
              color="primary"
              icon="event_repeat"
              @click="planSeries()"
            />
          </div>

          <div v-if="pastGroups.length > 0">
            <q-item
              clickable
              class="history-toggle rounded-lg"
              @click="showPast = !showPast"
            >
              <q-item-section class="text-grey-7 text-weight-medium">
                {{ t('past.toggle', { count: pastCount }) }}
              </q-item-section>
              <q-item-section side>
                <q-icon
                  :name="showPast ? 'expand_less' : 'expand_more'"
                  color="grey-7"
                />
              </q-item-section>
            </q-item>

            <div
              v-if="showPast"
              class="column no-wrap q-gutter-y-md q-mt-sm"
            >
              <div
                v-for="group in pastGroups"
                :key="group.date"
              >
                <div class="text-subtitle2 text-weight-medium q-mb-xs">
                  {{ d(parseLocalDate(group.date), 'dateFull') }}
                </div>
                <q-card
                  flat
                  bordered
                  class="rounded-xl overflow-hidden"
                >
                  <q-list separator>
                    <chore-assignment-card
                      v-for="assignment in group.items"
                      :key="assignment.id"
                      v-bind="cardProps(assignment)"
                      v-on="cardHandlers(assignment)"
                    />
                  </q-list>
                </q-card>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>

    <q-page-sticky
      v-if="canCreate && chores.length > 0 && quasar.screen.lt.sm"
      position="bottom-right"
      :offset="[16, 16]"
    >
      <q-btn
        fab
        icon="bolt"
        color="primary"
        :aria-label="t('action.quick')"
        @click="openAssignmentDialog()"
      />
    </q-page-sticky>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageHeader from '@/components/common/PageHeader.vue';
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useChoreStore } from '@/stores/chore-store';
import { useChoreAssignmentStore } from '@/stores/chore-assignment-store';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { usePermissions } from '@/composables/permissions';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatPersonName } from '@/utils/formatters';
import { addDays, formatLocalDate, parseLocalDate } from '@/utils/date';
import { compareAssignments, openSpots } from '@/utils/chores';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import ChoreAssignmentCard from '@/components/event/chorePlanner/ChoreAssignmentCard.vue';
import ChoreWeekGrid from '@/components/event/chorePlanner/ChoreWeekGrid.vue';
import ChoreAssignmentDialog from '@/components/event/chorePlanner/dialogs/ChoreAssignmentDialog.vue';
import ChoreSeriesDialog from '@/components/event/chorePlanner/dialogs/ChoreSeriesDialog.vue';
import ChoreFairnessDialog from '@/components/event/chorePlanner/dialogs/ChoreFairnessDialog.vue';
import ChoreManagerDialog from '@/components/event/chorePlanner/dialogs/ChoreManagerDialog.vue';
import ChoreRemovePersonDialog from '@/components/event/chorePlanner/dialogs/ChoreRemovePersonDialog.vue';
import ChorePersonPickerDialog from '@/components/event/chorePlanner/dialogs/ChorePersonPickerDialog.vue';
import ChoreDialog from '@/components/event/chorePlanner/dialogs/ChoreDialog.vue';
import ChorePrintDialog from '@/components/event/chorePlanner/dialogs/ChorePrintDialog.vue';
import { printChoreRoster } from '@/components/event/chorePlanner/printChoreRoster';
import type {
  Chore,
  ChoreAssignment,
  ChoreAssignmentCreateData,
  ChoreAssignmentMember,
  ChoreAssignmentStatus,
  ChoreAssignmentUpdateData,
  ChoreCreateData,
  ChoreMemberRemovalQuery,
  ChoreSeriesPlanData,
  Registration,
  Room,
} from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

type View = 'today' | 'week' | 'list';

const quasar = useQuasar();
const { t, d, locale } = useI18n();
const apiService = useAPIService();
const choreStore = useChoreStore();
const choreAssignmentStore = useChoreAssignmentStore();
const registrationsStore = useRegistrationsStore();
const eventDetailsStore = useEventDetailsStore();
const registrationHelper = useRegistrationHelper();
const { to } = useObjectTranslation();
const { can } = usePermissions();

const {
  data: roomsData,
  isLoading: roomsLoading,
  error: roomsError,
  lazyFetch: lazyFetchRooms,
  queryParam,
  checkNotNullWithError,
} = useServiceHandler<Room[]>();

// Started in setup so the first render already shows the loading state.
void registrationsStore.fetchData();
void choreStore.fetchData();
void choreAssignmentStore.fetchData();
void fetchRooms();

async function fetchRooms() {
  const eventId = checkNotNullWithError(queryParam('eventId'));
  await lazyFetchRooms(() => apiService.fetchRooms(eventId));
}

const loading = computed<boolean>(
  () =>
    registrationsStore.isLoading ||
    choreStore.isLoading ||
    choreAssignmentStore.isLoading ||
    roomsLoading.value,
);

const error = computed<string | null>(
  () =>
    registrationsStore.error ??
    choreStore.error ??
    choreAssignmentStore.error ??
    roomsError.value,
);

const chores = computed<Chore[]>(() => choreStore.data ?? []);
const assignments = computed<ChoreAssignment[]>(
  () => choreAssignmentStore.data ?? [],
);
const registrations = computed<Registration[]>(
  () => registrationsStore.data ?? [],
);
const rooms = computed<Room[]>(() => roomsData.value ?? []);
const choreById = computed(() => new Map(chores.value.map((c) => [c.id, c])));

const names = computed<Map<string, string>>(
  () =>
    new Map(
      registrations.value.map((registration) => [
        registration.id,
        formatPersonName(registrationHelper.uniqueName(registration)),
      ]),
    ),
);

const canCreate = computed(() => can('event.chore_assignments.create'));
const canEdit = computed(() => can('event.chore_assignments.edit'));
const canDelete = computed(() => can('event.chore_assignments.delete'));

const eventStart = computed(() => eventDetailsStore.data?.startAt.slice(0, 10));
const eventEnd = computed(() => eventDetailsStore.data?.endAt.slice(0, 10));
const today = formatLocalDate(new Date());

// Today's duties while the event runs, the full list before and after.
const chosenView = ref<View | null>(null);
// No week view on phones: there it would only repeat the list, a week at a
// time — the grid that makes it useful needs a wider screen.
const hasWeekView = computed<boolean>(() => !quasar.screen.lt.sm);

const view = computed<View>({
  get: () => {
    const value =
      chosenView.value ??
      (eventStart.value &&
      eventEnd.value &&
      eventStart.value <= today &&
      today <= eventEnd.value
        ? 'today'
        : 'list');
    return value === 'week' && !hasWeekView.value ? 'list' : value;
  },
  set: (value) => (chosenView.value = value),
});

const viewOptions = computed(() =>
  (
    [
      ['today', 'today'],
      ['week', 'view_week'],
      ['list', 'view_list'],
    ] as const
  )
    .filter(([value]) => value !== 'week' || hasWeekView.value)
    .map(([value, icon]) => ({
      value,
      label: t(`view.${value}`),
      ...(quasar.screen.lt.sm ? {} : { icon }),
    })),
);

// Filter
const filterChoreIds = ref<string[]>([]);

function toggleChoreFilter(choreId: string) {
  filterChoreIds.value = filterChoreIds.value.includes(choreId)
    ? filterChoreIds.value.filter((id) => id !== choreId)
    : [...filterChoreIds.value, choreId];
}

const visibleChores = computed<Chore[]>(() =>
  filterChoreIds.value.length === 0
    ? chores.value
    : chores.value.filter((c) => filterChoreIds.value.includes(c.id)),
);

const filteredAssignments = computed<ChoreAssignment[]>(() =>
  assignments.value
    .filter(
      (a) =>
        filterChoreIds.value.length === 0 ||
        filterChoreIds.value.includes(a.choreId),
    )
    .sort((a, b) => compareAssignments(a, b, choreById.value)),
);

// Today view
// Today while the event runs, otherwise its nearest day — so Day and Week
// don't open on empty dates before or after the event.
const focusDate = computed<string>(() => {
  if (eventStart.value && today < eventStart.value) {
    return eventStart.value;
  }
  if (eventEnd.value && today > eventEnd.value) {
    return eventEnd.value;
  }
  return today;
});

const chosenDay = ref<string | null>(null);
const day = computed<string>({
  get: () => chosenDay.value ?? focusDate.value,
  set: (value) => (chosenDay.value = value),
});

const dayAssignments = computed<ChoreAssignment[]>(() =>
  filteredAssignments.value.filter((a) => a.date === day.value),
);

const plannedToday = computed<ChoreAssignment[]>(() =>
  dayAssignments.value.filter((a) => a.status === 'PLANNED'),
);

const daySummary = computed<string>(() => {
  const open = dayAssignments.value.reduce(
    (sum, a) =>
      sum +
      openSpots(a, choreById.value.get(a.choreId), 'MEMBER') +
      openSpots(a, choreById.value.get(a.choreId), 'SUPERVISOR'),
    0,
  );
  return [
    t('summary.duties', dayAssignments.value.length),
    open > 0 ? t('summary.open', open) : t('summary.allFilled'),
  ].join(' · ');
});

// Week view
function mondayOf(date: string): string {
  const weekday = parseLocalDate(date).getDay();
  return addDays(date, weekday === 0 ? -6 : 1 - weekday);
}

const chosenWeekStart = ref<string | null>(null);
const weekStart = computed<string>({
  get: () => chosenWeekStart.value ?? mondayOf(focusDate.value),
  set: (value) => (chosenWeekStart.value = value),
});

function onSwipe({ direction }: { direction?: string }) {
  if (direction === 'left') {
    day.value = addDays(day.value, 1);
  } else if (direction === 'right') {
    day.value = addDays(day.value, -1);
  }
}

// Phones get the short weekday and date instead of the full date.
const dayTitle = computed<string>(() =>
  quasar.screen.lt.sm
    ? new Intl.DateTimeFormat(locale.value, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(parseLocalDate(day.value))
    : d(parseLocalDate(day.value), 'dateFull'),
);

const weekLabel = computed<string>(() => {
  const format = new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
  });
  return `${format.format(parseLocalDate(weekStart.value))} – ${format.format(
    parseLocalDate(addDays(weekStart.value, 6)),
  )}`;
});

// List view
const showPast = ref(false);

function groupByDate(list: ChoreAssignment[]) {
  const groups: { date: string; items: ChoreAssignment[] }[] = [];
  for (const assignment of list) {
    const last = groups.at(-1);
    if (last?.date === assignment.date) {
      last.items.push(assignment);
    } else {
      groups.push({ date: assignment.date, items: [assignment] });
    }
  }
  return groups;
}

const upcomingGroups = computed(() =>
  groupByDate(filteredAssignments.value.filter((a) => a.date >= today)),
);

const pastGroups = computed(() =>
  groupByDate(
    filteredAssignments.value.filter((a) => a.date < today),
  ).reverse(),
);

const pastCount = computed<number>(() =>
  pastGroups.value.reduce((sum, group) => sum + group.items.length, 0),
);

// Card wiring
function cardProps(assignment: ChoreAssignment) {
  return {
    assignment,
    chore: choreById.value.get(assignment.choreId),
    rooms: rooms.value,
    names: names.value,
    canEdit: canEdit.value,
    canDelete: canDelete.value,
  };
}

function cardHandlers(assignment: ChoreAssignment) {
  return {
    edit: () => editAssignment(assignment),
    delete: () => deleteAssignment(assignment),
    deleteSeries: () => deleteSeries(assignment),
    fill: () => void choreAssignmentStore.fillData(assignment.id),
    setStatus: (status: ChoreAssignmentStatus) =>
      void choreAssignmentStore.updateData(assignment.id, { status }),
    toggleMissed: (id: string) =>
      updateMembers(assignment, (members) =>
        members.map((m) =>
          m.registrationId === id ? { ...m, missed: !m.missed } : m,
        ),
      ),
    removeMember: (id: string) =>
      updateMembers(assignment, (members) =>
        members.filter((m) => m.registrationId !== id),
      ),
    replace: (id: string) => void replaceMember(assignment, id),
    replaceWith: (id: string) => pickPerson(assignment, id),
    addPerson: () => pickPerson(assignment),
  };
}

// Someone specific: in place of `replacing` (same role), or added to it.
function pickPerson(assignment: ChoreAssignment, replacing?: string) {
  const replaced = assignment.members.find(
    (m) => m.registrationId === replacing,
  );
  quasar
    .dialog({
      component: ChorePersonPickerDialog,
      componentProps: {
        assignment,
        role: replaced?.role ?? 'MEMBER',
        names: names.value,
        replacing,
      },
    })
    .onOk((registrationId: string) => {
      const picked = {
        registrationId,
        role: replaced?.role ?? ('MEMBER' as const),
        missed: false,
      };
      void choreAssignmentStore.updateData(assignment.id, {
        members: replaced
          ? assignment.members.map((m) =>
              m.registrationId === replacing ? picked : m,
            )
          : [...assignment.members, picked],
      });
    });
}

function updateMembers(
  assignment: ChoreAssignment,
  change: (members: ChoreAssignmentMember[]) => ChoreAssignmentMember[],
) {
  void choreAssignmentStore.updateData(assignment.id, {
    members: change(assignment.members),
  });
}

// The person stays in the auto-fill input as "missed": taken, but not filling
// a spot, so exactly one fair replacement comes back.
async function replaceMember(assignment: ChoreAssignment, id: string) {
  const replaced = assignment.members.find((m) => m.registrationId === id);
  if (!replaced) {
    return;
  }
  const active = (role: string) =>
    assignment.members.filter((m) => m.role === role && !m.missed).length;
  const members = assignment.members.map((m) =>
    m.registrationId === id ? { ...m, missed: true } : m,
  );
  const picks = await choreAssignmentStore.autoFillMembers({
    choreId: assignment.choreId,
    slotId: assignment.slotId,
    date: assignment.date,
    rotationUnit: 'PERSON',
    headcount: active('MEMBER'),
    supervisorCount: active('SUPERVISOR'),
    members,
    assignmentId: assignment.id,
  });
  if (picks.length === 0) {
    quasar.notify({ type: 'warning', message: t('noReplacement') });
    return;
  }
  await choreAssignmentStore.updateData(assignment.id, {
    members: [
      ...assignment.members.filter((m) => m.registrationId !== id),
      ...picks.map((pick) => ({
        registrationId: pick.registrationId,
        role: pick.role ?? replaced.role,
        missed: false,
      })),
    ],
  });
}

function markAllDone() {
  void choreAssignmentStore.setStatusMany(
    plannedToday.value.map((a) => a.id),
    'DONE',
  );
}

// Dialogs
const dialogContext = computed(() => ({
  chores: chores.value,
  registrations: registrations.value,
  rooms: rooms.value,
  locales: eventDetailsStore.data?.locales,
  countries: eventDetailsStore.data?.countries,
}));

function openAssignmentDialog(
  initial: {
    choreId?: string | undefined;
    slotId?: string | null;
    date?: string;
  } = {},
) {
  quasar
    .dialog({
      component: ChoreAssignmentDialog,
      componentProps: {
        ...dialogContext.value,
        initialChoreId: initial.choreId ?? filterChoreIds.value[0],
        initialSlotId: initial.slotId,
        initialDate:
          initial.date ??
          (view.value === 'today' ? day.value : focusDate.value),
      },
    })
    .onOk((payload: ChoreAssignmentCreateData) => {
      void choreAssignmentStore.createData(payload);
    });
}

function editAssignment(assignment: ChoreAssignment) {
  quasar
    .dialog({
      component: ChoreAssignmentDialog,
      componentProps: { ...dialogContext.value, assignment },
    })
    .onOk((payload: ChoreAssignmentUpdateData) => {
      void choreAssignmentStore.updateData(assignment.id, payload);
    });
}

function planSeries() {
  quasar
    .dialog({
      component: ChoreSeriesDialog,
      componentProps: {
        chores: chores.value,
        hasRooms: rooms.value.some((room) =>
          room.beds.some((bed) => bed.registrationId),
        ),
        eventStart: eventStart.value,
        eventEnd: eventEnd.value,
        initialChoreId: filterChoreIds.value[0],
        locales: dialogContext.value.locales,
        countries: dialogContext.value.countries,
      },
    })
    .onOk((payload: ChoreSeriesPlanData) => {
      void runSeries(payload);
    });
}

async function runSeries(payload: ChoreSeriesPlanData) {
  const result = await choreAssignmentStore.planSeries(payload);
  const batchId = result.batchId;
  quasar.notify({
    message: t('series.done', {
      created: result.created,
      filled: result.filled,
      skipped: result.skipped,
    }),
    timeout: 10000,
    actions: batchId
      ? [
          {
            label: t('action.undo'),
            color: 'primary',
            handler: () => void choreAssignmentStore.deleteMany({ batchId }),
          },
        ]
      : [],
  });
}

function confirm(message: string, onOk: () => void) {
  quasar
    .dialog({
      component: ConfirmDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message,
        okLabel: t('action.delete'),
        color: 'negative',
      },
    })
    .onOk(onOk);
}

function assignmentLabel(assignment: ChoreAssignment): string {
  const chore = choreById.value.get(assignment.choreId);
  return `${chore ? to(chore.name) : ''} (${d(parseLocalDate(assignment.date), 'date')})`;
}

function deleteAssignment(assignment: ChoreAssignment) {
  confirm(
    t('dialog.delete.one', { name: assignmentLabel(assignment) }),
    () => void choreAssignmentStore.deleteData(assignment.id),
  );
}

function deleteSeries(assignment: ChoreAssignment) {
  const batchId = assignment.batchId;
  if (!batchId) {
    return;
  }
  const count = assignments.value.filter((a) => a.batchId === batchId).length;
  confirm(
    t('dialog.delete.series', { count }),
    () => void choreAssignmentStore.deleteMany({ batchId }),
  );
}

function deleteDay(date: string) {
  confirm(
    t('dialog.delete.day', { date: d(parseLocalDate(date), 'date') }),
    () =>
      void choreAssignmentStore.deleteMany({
        from: date,
        to: date,
        // Only the chores on screen — hidden ones keep their duties.
        ...(filterChoreIds.value.length > 0
          ? { choreId: filterChoreIds.value }
          : {}),
      }),
  );
}

function openChoreManager() {
  // Nothing to manage yet — go straight to creating the first chore.
  if (chores.value.length === 0) {
    quasar
      .dialog({
        component: ChoreDialog,
        componentProps: {
          locales: dialogContext.value.locales,
          countries: dialogContext.value.countries,
        },
      })
      .onOk((payload: ChoreCreateData) => {
        void choreStore.createData(payload);
      });
    return;
  }
  quasar.dialog({
    component: ChoreManagerDialog,
    componentProps: {
      locales: dialogContext.value.locales,
      countries: dialogContext.value.countries,
    },
  });
}

function openFairness() {
  quasar.dialog({
    component: ChoreFairnessDialog,
    componentProps: { registrations: registrations.value },
  });
}

function removePerson() {
  quasar
    .dialog({
      component: ChoreRemovePersonDialog,
      componentProps: { registrations: registrations.value },
    })
    .onOk(
      (removal: { registrationId: string; query: ChoreMemberRemovalQuery }) => {
        void choreAssignmentStore.removeMember(
          removal.registrationId,
          removal.query,
        );
      },
    );
}

// The event's weeks, plus any other week that has duties.
const printableWeeks = computed<string[]>(() => {
  const weeks = new Set<string>();
  if (eventStart.value && eventEnd.value) {
    let week = mondayOf(eventStart.value);
    for (; week <= eventEnd.value; week = addDays(week, 7)) {
      weeks.add(week);
    }
  }
  for (const assignment of filteredAssignments.value) {
    if (assignment.status !== 'CANCELLED') {
      weeks.add(mondayOf(assignment.date));
    }
  }
  return [...weeks].sort();
});

function print() {
  const current = view.value === 'week' ? weekStart.value : mondayOf(day.value);
  const weeks = [...new Set([...printableWeeks.value, current])].sort();
  if (weeks.length === 1) {
    printWeeks(weeks);
    return;
  }
  quasar
    .dialog({
      component: ChorePrintDialog,
      componentProps: { weeks, current },
    })
    .onOk(printWeeks);
}

function printWeeks(weekStarts: string[]) {
  const event = eventDetailsStore.data;
  if (!event) {
    return;
  }
  const inWeeks = (date: string) =>
    weekStarts.some((week) => date >= week && date <= addDays(week, 6));
  printChoreRoster(
    {
      eventName: event.name,
      weekStarts,
      chores: visibleChores.value,
      assignments: filteredAssignments.value.filter(
        (a) => inWeeks(a.date) && a.status !== 'CANCELLED',
      ),
      names: [...names.value],
    },
    (message) => quasar.notify({ type: 'negative', message }),
  );
}
</script>

<style scoped>
.planner-content {
  max-width: 1080px;
  padding-bottom: 24px;
}

/* Room for the floating button below the last duty. */
@media (max-width: 599.98px) {
  .planner-content {
    padding-bottom: 88px;
  }
}

.chip-scroll {
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.empty-state {
  padding: 48px 16px;
}

.empty-icon {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}

.history-toggle {
  min-height: 44px;
}

.filter-chip {
  height: 32px;
  margin: 0;
  padding: 0 12px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 8px;
  background: transparent;
  color: var(--md3-on-surface-variant);
  font-size: 13px;
  font-weight: 500;
}

.filter-chip--active {
  border-color: transparent;
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Duty roster'
subtitle: 'Share out kitchen duty, cleaning and other chores fairly.'
noDuties: 'No duties on this day.'
noAssignments: 'No duties planned yet — plan a whole week in one go.'
noUpcoming: 'No upcoming duties.'
noReplacement: 'No one else is available for this duty.'

view:
  today: 'Day'
  week: 'Week'
  list: 'List'

nav:
  previousDay: 'Previous day'
  nextDay: 'Next day'
  today: 'Today'
  previousWeek: 'Previous week'
  nextWeek: 'Next week'
  thisWeek: 'This week'

summary:
  duties: 'No duties | 1 duty | {n} duties'
  open: 'no open spots | 1 open spot | {n} open spots'
  allFilled: 'all spots filled'

series:
  done: 'Planned {created} new duties ({filled} topped up, {skipped} left as they were).'

action:
  quick: 'Quick duty'
  series: 'Plan duties'
  more: 'More'
  chores: 'Chores'
  addChore: 'Add chore'
  fairness: 'Fairness'
  removePerson: 'Remove someone from duties…'
  print: 'Print…'
  allDone: 'All done'
  deleteDay: 'Delete all duties of this day'
  delete: 'Delete'
  undo: 'Undo'

empty:
  title: 'No chores yet'
  message: 'Create a chore — like Kitchen or Dishwashing — to start planning.'

past:
  toggle: 'Past duties ({count})'

dialog:
  delete:
    title: 'Delete duties'
    one: 'Do you really want to delete "{name}"?'
    series: 'Delete all {count} duties of this series? Duties that are already done are deleted too.'
    day: 'Delete all duties on {date}?'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Dienstplan'
subtitle: 'Küchendienst, Putzen und andere Dienste fair verteilen.'
noDuties: 'An diesem Tag gibt es keine Dienste.'
noAssignments: 'Noch keine Dienste geplant — plane eine ganze Woche auf einmal.'
noUpcoming: 'Keine bevorstehenden Dienste.'
noReplacement: 'Niemand sonst ist für diesen Dienst verfügbar.'

view:
  today: 'Tag'
  week: 'Woche'
  list: 'Liste'

nav:
  previousDay: 'Vorheriger Tag'
  nextDay: 'Nächster Tag'
  today: 'Heute'
  previousWeek: 'Vorherige Woche'
  nextWeek: 'Nächste Woche'
  thisWeek: 'Diese Woche'

summary:
  duties: 'Keine Dienste | 1 Dienst | {n} Dienste'
  open: 'keine offenen Plätze | 1 offener Platz | {n} offene Plätze'
  allFilled: 'alle Plätze besetzt'

series:
  done: '{created} neue Dienste geplant ({filled} aufgefüllt, {skipped} unverändert).'

action:
  quick: 'Schnell-Dienst'
  series: 'Dienste planen'
  more: 'Mehr'
  chores: 'Diensttypen'
  addChore: 'Diensttyp hinzufügen'
  fairness: 'Fairness'
  removePerson: 'Jemanden aus Diensten nehmen…'
  print: 'Drucken…'
  allDone: 'Alle erledigt'
  deleteDay: 'Alle Dienste dieses Tages löschen'
  delete: 'Löschen'
  undo: 'Rückgängig'

empty:
  title: 'Noch keine Diensttypen'
  message: 'Erstelle einen Diensttyp — z. B. Küche oder Abwasch — um mit der Planung zu beginnen.'

past:
  toggle: 'Vergangene Dienste ({count})'

dialog:
  delete:
    title: 'Dienste löschen'
    one: 'Möchtest du „{name}“ wirklich löschen?'
    series: 'Alle {count} Dienste dieser Serie löschen? Auch bereits erledigte Dienste werden gelöscht.'
    day: 'Alle Dienste am {date} löschen?'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Plan des corvées'
subtitle: 'Répartis équitablement la cuisine, le ménage et les autres corvées.'
noDuties: 'Aucune corvée ce jour-là.'
noAssignments: 'Aucune corvée prévue pour le moment — planifie toute une semaine d’un coup.'
noUpcoming: 'Aucune corvée à venir.'
noReplacement: 'Personne d’autre n’est disponible pour cette corvée.'

view:
  today: 'Jour'
  week: 'Semaine'
  list: 'Liste'

nav:
  previousDay: 'Jour précédent'
  nextDay: 'Jour suivant'
  today: "Aujourd'hui"
  previousWeek: 'Semaine précédente'
  nextWeek: 'Semaine suivante'
  thisWeek: 'Cette semaine'

summary:
  duties: 'Aucune corvée | 1 corvée | {n} corvées'
  open: 'aucune place libre | 1 place libre | {n} places libres'
  allFilled: 'toutes les places sont prises'

series:
  done: '{created} nouvelles corvées planifiées ({filled} complétées, {skipped} laissées telles quelles).'

action:
  quick: 'Corvée rapide'
  series: 'Planifier des corvées'
  more: 'Plus'
  chores: 'Corvées'
  addChore: 'Ajouter une corvée'
  fairness: 'Équité'
  removePerson: 'Retirer quelqu’un des corvées…'
  print: 'Imprimer…'
  allDone: 'Tout est fait'
  deleteDay: 'Supprimer toutes les corvées de ce jour'
  delete: 'Supprimer'
  undo: 'Annuler'

empty:
  title: 'Aucune corvée pour le moment'
  message: 'Crée une corvée — comme Cuisine ou Vaisselle — pour commencer à planifier.'

past:
  toggle: 'Corvées passées ({count})'

dialog:
  delete:
    title: 'Supprimer des corvées'
    one: 'Veux-tu vraiment supprimer « {name} » ?'
    series: 'Supprimer les {count} corvées de cette série ? Les corvées déjà faites sont aussi supprimées.'
    day: 'Supprimer toutes les corvées du {date} ?'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Grafik dyżurów'
subtitle: 'Sprawiedliwie dziel dyżury w kuchni, sprzątanie i inne obowiązki.'
noDuties: 'Brak dyżurów tego dnia.'
noAssignments: 'Nie zaplanowano jeszcze dyżurów — zaplanuj cały tydzień za jednym razem.'
noUpcoming: 'Brak nadchodzących dyżurów.'
noReplacement: 'Nikt inny nie jest dostępny do tego dyżuru.'

view:
  today: 'Dzień'
  week: 'Tydzień'
  list: 'Lista'

nav:
  previousDay: 'Poprzedni dzień'
  nextDay: 'Następny dzień'
  today: 'Dziś'
  previousWeek: 'Poprzedni tydzień'
  nextWeek: 'Następny tydzień'
  thisWeek: 'Ten tydzień'

summary:
  duties: 'Brak dyżurów | 1 dyżur | {n} dyżurów'
  open: 'brak wolnych miejsc | 1 wolne miejsce | {n} wolnych miejsc'
  allFilled: 'wszystkie miejsca obsadzone'

series:
  done: 'Zaplanowano {created} nowych dyżurów ({filled} uzupełnionych, {skipped} bez zmian).'

action:
  quick: 'Szybki dyżur'
  series: 'Zaplanuj dyżury'
  more: 'Więcej'
  chores: 'Obowiązki'
  addChore: 'Dodaj obowiązek'
  fairness: 'Sprawiedliwość'
  removePerson: 'Usuń kogoś z dyżurów…'
  print: 'Drukuj…'
  allDone: 'Wszystko wykonane'
  deleteDay: 'Usuń wszystkie dyżury tego dnia'
  delete: 'Usuń'
  undo: 'Cofnij'

empty:
  title: 'Brak obowiązków'
  message: 'Utwórz obowiązek — np. Kuchnia lub Zmywanie — aby zacząć planowanie.'

past:
  toggle: 'Minione dyżury ({count})'

dialog:
  delete:
    title: 'Usuń dyżury'
    one: 'Czy na pewno chcesz usunąć „{name}”?'
    series: 'Usunąć wszystkie {count} dyżurów tej serii? Wykonane dyżury również zostaną usunięte.'
    day: 'Usunąć wszystkie dyżury z dnia {date}?'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Rozpis služeb'
subtitle: 'Spravedlivě rozděl kuchyňské služby, úklid a další povinnosti.'
noDuties: 'V tento den nejsou žádné služby.'
noAssignments: 'Zatím nejsou naplánované žádné služby — naplánuj celý týden najednou.'
noUpcoming: 'Žádné nadcházející služby.'
noReplacement: 'Na tuto službu už nikdo další není k dispozici.'

view:
  today: 'Den'
  week: 'Týden'
  list: 'Seznam'

nav:
  previousDay: 'Předchozí den'
  nextDay: 'Další den'
  today: 'Dnes'
  previousWeek: 'Předchozí týden'
  nextWeek: 'Další týden'
  thisWeek: 'Tento týden'

summary:
  duties: 'Žádné služby | 1 služba | {n} služeb'
  open: 'žádná volná místa | 1 volné místo | {n} volných míst'
  allFilled: 'všechna místa obsazena'

series:
  done: 'Naplánováno {created} nových služeb ({filled} doplněno, {skipped} beze změny).'

action:
  quick: 'Rychlá služba'
  series: 'Naplánovat služby'
  more: 'Více'
  chores: 'Povinnosti'
  addChore: 'Přidat povinnost'
  fairness: 'Spravedlnost'
  removePerson: 'Odebrat někoho ze služeb…'
  print: 'Tisk…'
  allDone: 'Vše hotovo'
  deleteDay: 'Smazat všechny služby tohoto dne'
  delete: 'Smazat'
  undo: 'Vrátit'

empty:
  title: 'Zatím žádné povinnosti'
  message: 'Vytvoř povinnost — např. Kuchyně nebo Mytí nádobí — a začni plánovat.'

past:
  toggle: 'Minulé služby ({count})'

dialog:
  delete:
    title: 'Smazat služby'
    one: 'Opravdu chceš smazat „{name}“?'
    series: 'Smazat všech {count} služeb této série? Smazány budou i již hotové služby.'
    day: 'Smazat všechny služby dne {date}?'
</i18n>
