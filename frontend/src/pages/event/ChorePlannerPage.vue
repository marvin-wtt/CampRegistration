<template>
  <page-state-handler
    padding
    :error
    :loading
    class="chore-planner-page row justify-center"
  >
    <div
      class="planner-content col-12 col-md-11 col-lg-10 column q-gutter-y-lg"
    >
      <!-- Header -->
      <div class="row items-start justify-between q-col-gutter-y-sm">
        <div class="col-12 col-sm page-title">
          <div class="text-h5 text-weight-medium">
            {{ t('title') }}
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            {{ t('subtitle') }}
          </div>
        </div>

        <div class="col-12 col-sm-auto row q-gutter-x-xs justify-end">
          <m-btn
            v-if="chores.length > 0"
            icon="history"
            square
            round
            text
            :aria-label="t('action.history')"
            @click="openHistoryDialog"
          >
            <q-tooltip>{{ t('action.history') }}</q-tooltip>
          </m-btn>
          <m-btn
            v-if="chores.length > 0 || can('event.chores.create')"
            :label="t('action.addDutyType')"
            icon="tune"
            outline
            @click="openChoreManager"
          />
          <m-btn
            v-if="can('event.chore_assignments.create')"
            :label="t('action.add')"
            color="primary"
            icon="add"
            :disable="chores.length === 0"
            @click="addAssignment"
          >
            <q-tooltip v-if="chores.length === 0">
              {{ t('hint.needDutyType') }}
            </q-tooltip>
          </m-btn>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="!loading && chores.length === 0"
        class="empty-state col column items-center justify-center"
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
          :label="t('action.addDutyType')"
          color="primary"
          icon="add"
          @click="openChoreManager"
        />
      </div>

      <!-- Chore filter -->
      <div
        v-if="chores.length > 1 && assignments.length > 0"
        class="row items-center filter-row"
      >
        <span class="text-caption text-grey-7">{{ t('filter.label') }}</span>
        <q-chip
          v-for="chore in chores"
          :key="chore.id"
          clickable
          class="filter-chip"
          :class="{ 'filter-chip--active': filterChoreIds.includes(chore.id) }"
          @click="toggleChoreFilter(chore.id)"
        >
          {{ to(chore.name) }}
          <q-icon
            v-if="filterChoreIds.includes(chore.id)"
            name="check"
            size="16px"
            class="q-ml-xs"
          />
        </q-chip>
      </div>

      <!-- Assignment groups: next duty always first, past ones tucked away -->
      <div
        v-if="upcomingGroups.length > 0"
        class="column q-gutter-y-md"
      >
        <div
          v-for="group in upcomingGroups"
          :key="group.date"
        >
          <div class="text-subtitle2 text-weight-medium q-mb-xs">
            {{ d(parseLocalDate(group.date), 'date') }}
          </div>

          <q-card
            flat
            bordered
            class="section-card"
          >
            <q-list separator>
              <q-item
                v-for="assignment in group.items"
                :key="assignment.id"
                :class="{
                  'assignment-item--warning':
                    assignment.registrationIds.length === 0,
                }"
              >
                <q-item-section avatar>
                  <q-icon
                    v-if="assignment.registrationIds.length === 0"
                    name="warning_amber"
                    color="warning"
                  />
                  <q-icon
                    v-else
                    :name="
                      assignment.rotationUnit === 'ROOM'
                        ? 'meeting_room'
                        : 'person'
                    "
                    color="grey-6"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    {{ to(assignment.chore.name) }}
                    <span
                      v-if="assignment.slot"
                      class="text-grey-6"
                    >
                      — {{ assignment.slot }}
                    </span>
                  </q-item-label>
                  <q-item-label
                    caption
                    class="q-mt-xs"
                  >
                    <span v-if="assignment.registrationIds.length > 0">
                      {{ memberNames(assignment) }}
                    </span>
                    <span
                      v-else
                      class="text-warning text-weight-medium"
                    >
                      {{ t('noMembers') }}
                    </span>
                  </q-item-label>
                </q-item-section>

                <q-item-section
                  v-if="canManageAssignments"
                  side
                >
                  <div class="row q-gutter-x-xs">
                    <q-btn
                      v-if="can('event.chore_assignments.edit')"
                      icon="edit"
                      flat
                      round
                      dense
                      :aria-label="t('action.edit')"
                      @click="editAssignment(assignment)"
                    />
                    <q-btn
                      v-if="can('event.chore_assignments.delete')"
                      icon="delete"
                      flat
                      round
                      dense
                      :aria-label="t('action.delete')"
                      @click="deleteAssignment(assignment)"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>
      </div>

      <div
        v-else-if="chores.length > 0 && assignments.length === 0"
        class="empty-state col column items-center justify-center"
      >
        <q-icon
          name="event_available"
          size="64px"
          class="empty-icon"
        />
        <div class="text-h6 q-mt-md">
          {{ t('emptyAssignments.title') }}
        </div>
        <div class="text-body2 text-grey-6 q-mt-xs text-center">
          {{ t('emptyAssignments.message') }}
        </div>
      </div>

      <div
        v-else-if="chores.length > 0"
        class="text-body2 text-grey-6"
      >
        {{ t('noUpcoming') }}
      </div>

      <!-- Past assignments: tucked away, most recent first -->
      <div v-if="pastGroups.length > 0">
        <q-item
          clickable
          class="history-toggle"
          @click="showPast = !showPast"
        >
          <q-item-section class="text-grey-7 text-weight-medium">
            {{ t('past.toggle', { count: pastAssignmentCount }) }}
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
          class="column q-gutter-y-md q-mt-sm"
        >
          <div
            v-for="group in pastGroups"
            :key="group.date"
          >
            <div class="text-subtitle2 text-weight-medium q-mb-xs">
              {{ d(parseLocalDate(group.date), 'date') }}
            </div>

            <q-card
              flat
              bordered
              class="section-card"
            >
              <q-list separator>
                <q-item
                  v-for="assignment in group.items"
                  :key="assignment.id"
                >
                  <q-item-section avatar>
                    <q-icon
                      :name="
                        assignment.rotationUnit === 'ROOM'
                          ? 'meeting_room'
                          : 'person'
                      "
                      color="grey-6"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>
                      {{ to(assignment.chore.name) }}
                      <span
                        v-if="assignment.slot"
                        class="text-grey-6"
                      >
                        — {{ assignment.slot }}
                      </span>
                    </q-item-label>
                    <q-item-label
                      caption
                      class="q-mt-xs"
                    >
                      <span v-if="assignment.registrationIds.length > 0">
                        {{ memberNames(assignment) }}
                      </span>
                      <span
                        v-else
                        class="text-grey-6"
                      >
                        {{ t('noMembers') }}
                      </span>
                    </q-item-label>
                  </q-item-section>

                  <q-item-section
                    v-if="canManageAssignments"
                    side
                  >
                    <div class="row q-gutter-x-xs">
                      <q-btn
                        v-if="can('event.chore_assignments.edit')"
                        icon="edit"
                        flat
                        round
                        dense
                        :aria-label="t('action.edit')"
                        @click="editAssignment(assignment)"
                      />
                      <q-btn
                        v-if="can('event.chore_assignments.delete')"
                        icon="delete"
                        flat
                        round
                        dense
                        :aria-label="t('action.delete')"
                        @click="deleteAssignment(assignment)"
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
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
import { formatLocalDate, parseLocalDate } from '@/utils/date';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import ChoreAssignmentDialog from '@/components/event/chorePlanner/dialogs/ChoreAssignmentDialog.vue';
import ChoreHistoryDialog from '@/components/event/chorePlanner/dialogs/ChoreHistoryDialog.vue';
import ChoreManagerDialog from '@/components/event/chorePlanner/dialogs/ChoreManagerDialog.vue';
import ChoreDialog from '@/components/event/chorePlanner/dialogs/ChoreDialog.vue';
import type {
  Chore,
  ChoreAssignment,
  ChoreCreateData,
  Registration,
  Room,
} from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const quasar = useQuasar();
const { t, d } = useI18n();
const apiService = useAPIService();
const choreStore = useChoreStore();
const choreAssignmentStore = useChoreAssignmentStore();
const registrationsStore = useRegistrationsStore();
const eventDetailsStore = useEventDetailsStore();
const registrationHelper = useRegistrationHelper();
const { to } = useObjectTranslation();
const { can } = usePermissions();

const showPast = ref(false);
const filterChoreIds = ref<string[]>([]);

const locales = computed<string[] | undefined>(() => {
  return eventDetailsStore.data?.locales;
});

const countries = computed<string[] | undefined>(() => {
  return eventDetailsStore.data?.countries;
});

const {
  data: roomsData,
  isLoading: roomsLoading,
  error: roomsError,
  lazyFetch: lazyFetchRooms,
  queryParam,
  checkNotNullWithError,
} = useServiceHandler<Room[]>();

onMounted(async () => {
  await Promise.all([
    registrationsStore.fetchData(),
    choreStore.fetchData(),
    choreAssignmentStore.fetchData(),
    fetchRooms(),
  ]);
});

async function fetchRooms() {
  const eventId = queryParam('eventId');
  const cid = checkNotNullWithError(eventId);
  await lazyFetchRooms(() => apiService.fetchRooms(cid));
}

const loading = computed<boolean>(() => {
  return (
    registrationsStore.isLoading ||
    choreStore.isLoading ||
    choreAssignmentStore.isLoading ||
    roomsLoading.value
  );
});

const error = computed<string | null>(() => {
  return (
    registrationsStore.error ??
    choreStore.error ??
    choreAssignmentStore.error ??
    roomsError.value
  );
});

const chores = computed<Chore[]>(() => choreStore.data ?? []);
const assignments = computed<ChoreAssignment[]>(
  () => choreAssignmentStore.data ?? [],
);
const registrations = computed<Registration[]>(
  () => registrationsStore.data ?? [],
);
const rooms = computed<Room[]>(() => roomsData.value ?? []);

function toggleChoreFilter(choreId: string) {
  filterChoreIds.value = filterChoreIds.value.includes(choreId)
    ? filterChoreIds.value.filter((id) => id !== choreId)
    : [...filterChoreIds.value, choreId];
}

const canManageAssignments = computed<boolean>(() => {
  return (
    can('event.chore_assignments.edit') || can('event.chore_assignments.delete')
  );
});

const filteredAssignments = computed<ChoreAssignment[]>(() => {
  if (filterChoreIds.value.length === 0) {
    return assignments.value;
  }
  return assignments.value.filter((assignment) =>
    filterChoreIds.value.includes(assignment.choreId),
  );
});

function groupByDate(
  list: ChoreAssignment[],
): { date: string; items: ChoreAssignment[] }[] {
  const groups: { date: string; items: ChoreAssignment[] }[] = [];

  for (const assignment of list) {
    const last = groups[groups.length - 1];
    if (last && last.date === assignment.date) {
      last.items.push(assignment);
    } else {
      groups.push({ date: assignment.date, items: [assignment] });
    }
  }

  return groups;
}

const today = computed<string>(() => formatLocalDate(new Date()));

// The store already returns assignments sorted by date ascending, so the
// next upcoming occurrence is naturally first once past ones are dropped.
const upcomingGroups = computed<{ date: string; items: ChoreAssignment[] }[]>(
  () =>
    groupByDate(filteredAssignments.value.filter((a) => a.date >= today.value)),
);

// Tucked behind a toggle, most-recent-first — this is a record of what
// already happened, not something that needs to compete with what's next.
const pastGroups = computed<{ date: string; items: ChoreAssignment[] }[]>(() =>
  groupByDate(
    filteredAssignments.value.filter((a) => a.date < today.value),
  ).reverse(),
);

const pastAssignmentCount = computed<number>(() =>
  pastGroups.value.reduce((sum, group) => sum + group.items.length, 0),
);

function registrationName(id: string): string | undefined {
  const registration = registrations.value.find((value) => value.id === id);
  return registration
    ? formatPersonName(registrationHelper.uniqueName(registration))
    : undefined;
}

// The room a registration currently occupies, if any — used to enrich the
// member list display and to build the room history. Membership itself is
// still a plain participant list (see the plan: rooms are a display/quick-add
// convenience, not a live link), so this is always resolved fresh.
function currentRoom(registrationId: string): Room | undefined {
  return rooms.value.find((room) =>
    room.beds.some((bed) => bed.registrationId === registrationId),
  );
}

// If every member of the assignment currently lives in the same room, lead
// with that room's name so a room-based chore reads as "Room 101: Alice, Bob"
// instead of just a bare name list.
function commonRoomName(ids: string[]): string | undefined {
  if (ids.length === 0) {
    return undefined;
  }

  const firstRoom = currentRoom(ids[0]!);
  if (!firstRoom) {
    return undefined;
  }

  const sameRoom = ids.every((id) => currentRoom(id)?.id === firstRoom.id);
  return sameRoom ? to(firstRoom.name) : undefined;
}

function memberNames(assignment: ChoreAssignment): string {
  const names = assignment.registrationIds
    .map((id) => registrationName(id) ?? t('unknownParticipant'))
    .join(', ');

  const roomName = commonRoomName(assignment.registrationIds);
  return roomName ? `${roomName}: ${names}` : names;
}

function openHistoryDialog() {
  quasar.dialog({
    component: ChoreHistoryDialog,
    componentProps: {
      chores: chores.value,
      assignments: assignments.value,
      registrations: registrations.value,
      rooms: rooms.value,
    },
  });
}

function assignmentLabel(assignment: ChoreAssignment): string {
  const datePart = d(parseLocalDate(assignment.date), 'date');
  const choreName = to(assignment.chore.name);
  return assignment.slot
    ? `${choreName} — ${assignment.slot} (${datePart})`
    : `${choreName} (${datePart})`;
}

function openChoreManager() {
  // Nothing to manage yet — skip straight to creating the first chore
  // instead of opening a manager dialog that's just going to be empty.
  if (chores.value.length === 0) {
    addChore();
    return;
  }
  quasar.dialog({
    component: ChoreManagerDialog,
    componentProps: { locales: locales.value, countries: countries.value },
  });
}

function addChore() {
  quasar
    .dialog({
      component: ChoreDialog,
      componentProps: { locales: locales.value, countries: countries.value },
    })
    .onOk((payload: ChoreCreateData) => {
      void choreStore.createData(payload);
    });
}

function addAssignment() {
  quasar
    .dialog({
      component: ChoreAssignmentDialog,
      componentProps: {
        chores: chores.value,
        registrations: registrations.value,
        rooms: rooms.value,
        locales: locales.value,
        countries: countries.value,
      },
    })
    .onOk((payload) => {
      void choreAssignmentStore.createData(payload);
    });
}

function editAssignment(assignment: ChoreAssignment) {
  quasar
    .dialog({
      component: ChoreAssignmentDialog,
      componentProps: {
        assignment,
        chores: chores.value,
        registrations: registrations.value,
        rooms: rooms.value,
        locales: locales.value,
        countries: countries.value,
      },
    })
    .onOk((payload) => {
      void choreAssignmentStore.updateData(assignment.id, payload);
    });
}

function deleteAssignment(assignment: ChoreAssignment) {
  quasar
    .dialog({
      component: ConfirmDialog,
      componentProps: {
        title: t('dialog.deleteAssignment.title'),
        message: t('dialog.deleteAssignment.message', {
          name: assignmentLabel(assignment),
        }),
        okLabel: t('action.delete'),
        color: 'negative',
      },
    })
    .onOk(() => {
      void choreAssignmentStore.deleteData(assignment.id);
    });
}
</script>

<style scoped>
.planner-content {
  max-width: 960px;
  padding-bottom: 24px;
}

.section-card {
  border-radius: 16px;
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

.assignment-item--warning {
  border-left: 3px solid var(--md3-warning);
  background: var(--md3-warning-container);
}

.filter-row {
  gap: 8px;
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
subtitle: 'Plan kitchen duty and other rotating chores.'
noMembers: 'No one assigned yet'
unknownParticipant: 'Unknown participant'

action:
  add: 'New assignment'
  addDutyType: 'Chores'
  history: 'Assignment history'
  edit: 'Edit'
  delete: 'Delete'

hint:
  needDutyType: 'Create a chore first'

empty:
  title: 'No chores yet'
  message: 'Create a chore — like Kitchen or Dishwashing — to start planning.'

emptyAssignments:
  title: 'No assignments yet'
  message: 'Plan the next duty to get started.'

noUpcoming: 'No upcoming duties.'

filter:
  label: 'Filter:'

past:
  toggle: 'Past duties ({count})'

dialog:
  deleteAssignment:
    title: 'Delete duty assignment'
    message: 'Do you really want to delete "{name}"?'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Dienstplan'
subtitle: 'Plane Küchendienst und weitere wiederkehrende Dienste.'
noMembers: 'Noch niemand zugewiesen'
unknownParticipant: 'Unbekannter Teilnehmer'

action:
  add: 'Neuer Einsatz'
  addDutyType: 'Diensttypen'
  history: 'Einsatzverlauf'
  edit: 'Bearbeiten'
  delete: 'Löschen'

hint:
  needDutyType: 'Erstelle zuerst einen Diensttyp'

empty:
  title: 'Noch keine Diensttypen'
  message: 'Erstelle einen Diensttyp — z. B. Küche oder Abwasch — um mit der Planung zu beginnen.'

emptyAssignments:
  title: 'Noch keine Einsätze'
  message: 'Plane den nächsten Dienst, um loszulegen.'

noUpcoming: 'Keine bevorstehenden Dienste.'

filter:
  label: 'Filter:'

past:
  toggle: 'Vergangene Dienste ({count})'

dialog:
  deleteAssignment:
    title: 'Diensteinsatz löschen'
    message: 'Möchtest du „{name}“ wirklich löschen?'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Plan des corvées'
subtitle: "Planifie le service de cuisine et d'autres corvées récurrentes."
noMembers: 'Personne assigné pour le moment'
unknownParticipant: 'Participant inconnu'

action:
  add: 'Nouvelle affectation'
  addDutyType: 'Corvées'
  history: 'Historique des affectations'
  edit: 'Modifier'
  delete: 'Supprimer'

hint:
  needDutyType: "Crée d'abord une corvée"

empty:
  title: 'Aucune corvée pour le moment'
  message: 'Crée une corvée — comme Cuisine ou Vaisselle — pour commencer à planifier.'

emptyAssignments:
  title: 'Aucune affectation pour le moment'
  message: 'Planifie la prochaine corvée pour commencer.'

noUpcoming: 'Aucune corvée à venir.'

filter:
  label: 'Filtrer :'

past:
  toggle: 'Corvées passées ({count})'

dialog:
  deleteAssignment:
    title: "Supprimer l'affectation de corvée"
    message: 'Veux-tu vraiment supprimer « {name} » ?'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Grafik dyżurów'
subtitle: 'Zaplanuj dyżur kuchenny i inne cykliczne obowiązki.'
noMembers: 'Nikt jeszcze nie przypisany'
unknownParticipant: 'Nieznany uczestnik'

action:
  add: 'Nowe przypisanie'
  addDutyType: 'Obowiązki'
  history: 'Historia przypisań'
  edit: 'Edytuj'
  delete: 'Usuń'

hint:
  needDutyType: 'Najpierw utwórz obowiązek'

empty:
  title: 'Brak obowiązków'
  message: 'Utwórz obowiązek — np. Kuchnia lub Zmywanie — aby zacząć planowanie.'

emptyAssignments:
  title: 'Brak przypisań'
  message: 'Zaplanuj kolejny dyżur, aby zacząć.'

noUpcoming: 'Brak nadchodzących dyżurów.'

filter:
  label: 'Filtruj:'

past:
  toggle: 'Minione dyżury ({count})'

dialog:
  deleteAssignment:
    title: 'Usuń przypisanie dyżuru'
    message: 'Czy na pewno chcesz usunąć „{name}”?'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Rozpis služeb'
subtitle: 'Naplánuj kuchyňskou službu a další opakující se povinnosti.'
noMembers: 'Zatím nikdo přiřazen'
unknownParticipant: 'Neznámý účastník'

action:
  add: 'Nové přiřazení'
  addDutyType: 'Povinnosti'
  history: 'Historie přiřazení'
  edit: 'Upravit'
  delete: 'Smazat'

hint:
  needDutyType: 'Nejprve vytvoř povinnost'

empty:
  title: 'Zatím žádné povinnosti'
  message: 'Vytvoř povinnost — např. Kuchyně nebo Mytí nádobí — a začni plánovat.'

emptyAssignments:
  title: 'Zatím žádná přiřazení'
  message: 'Naplánuj další službu a začni.'

noUpcoming: 'Žádné nadcházející služby.'

filter:
  label: 'Filtr:'

past:
  toggle: 'Minulé služby ({count})'

dialog:
  deleteAssignment:
    title: 'Smazat přiřazení služby'
    message: 'Opravdu chceš smazat „{name}“?'
</i18n>
