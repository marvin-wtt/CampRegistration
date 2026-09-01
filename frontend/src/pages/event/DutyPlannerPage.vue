<template>
  <page-state-handler
    padding
    :error
    :loading
    class="duty-planner-page row justify-center"
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
            v-if="can('event.duties.create')"
            :label="t('action.addDutyType')"
            icon="tune"
            outline
            @click="addDutyType"
          />
          <m-btn
            v-if="can('event.duty_assignments.create')"
            :label="t('action.add')"
            color="primary"
            icon="add"
            :disable="duties.length === 0"
            @click="addAssignment"
          >
            <q-tooltip v-if="duties.length === 0">
              {{ t('hint.needDutyType') }}
            </q-tooltip>
          </m-btn>
        </div>
      </div>

      <!-- Duty types -->
      <q-card
        v-if="duties.length > 0"
        flat
        bordered
        class="section-card"
      >
        <q-list separator>
          <q-item
            v-for="duty in duties"
            :key="duty.id"
          >
            <q-item-section avatar>
              <q-icon
                name="checklist"
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ to(duty.name) }}</q-item-label>
              <q-item-label
                v-if="
                  duty.defaultCount ||
                  duty.excludeStaff ||
                  duty.balanceCountries
                "
                caption
              >
                <span v-if="duty.defaultCount">
                  {{ t('dutyType.defaultCount', { count: duty.defaultCount }) }}
                </span>
                <span v-if="duty.excludeStaff">
                  · {{ t('dutyType.excludeStaff') }}
                </span>
                <span v-if="duty.balanceCountries">
                  · {{ t('dutyType.balanceCountries') }}
                </span>
              </q-item-label>
            </q-item-section>
            <q-item-section
              v-if="canManageDutyTypes"
              side
            >
              <div class="row q-gutter-x-xs">
                <q-btn
                  v-if="can('event.duties.edit')"
                  icon="edit"
                  flat
                  round
                  dense
                  :aria-label="t('action.edit')"
                  @click="editDutyType(duty)"
                />
                <q-btn
                  v-if="can('event.duties.delete')"
                  icon="delete"
                  flat
                  round
                  dense
                  :aria-label="t('action.delete')"
                  @click="deleteDutyType(duty)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <!-- Empty state -->
      <div
        v-if="!loading && duties.length === 0"
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
          v-if="can('event.duties.create')"
          class="q-mt-lg"
          :label="t('action.addDutyType')"
          color="primary"
          icon="add"
          @click="addDutyType"
        />
      </div>

      <!-- Assignment groups -->
      <div
        v-else-if="groupedAssignments.length > 0"
        class="column q-gutter-y-md"
      >
        <div
          v-for="group in groupedAssignments"
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
                    {{ to(assignment.duty.name) }}
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
                      v-if="can('event.duty_assignments.edit')"
                      icon="edit"
                      flat
                      round
                      dense
                      :aria-label="t('action.edit')"
                      @click="editAssignment(assignment)"
                    />
                    <q-btn
                      v-if="can('event.duty_assignments.delete')"
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
        v-else-if="duties.length > 0"
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

      <!-- History -->
      <div v-if="duties.length > 0">
        <q-item
          clickable
          class="history-toggle"
          @click="showHistory = !showHistory"
        >
          <q-item-section class="text-grey-7 text-weight-medium">
            {{ t('history.toggle') }}
          </q-item-section>
          <q-item-section side>
            <q-icon
              :name="showHistory ? 'expand_less' : 'expand_more'"
              color="grey-7"
            />
          </q-item-section>
        </q-item>

        <div
          v-if="showHistory"
          class="column q-gutter-y-md q-mt-sm"
        >
          <q-select
            v-model="historyDutyId"
            :label="t('history.dutyLabel')"
            :options="dutyOptions"
            map-options
            emit-value
            outlined
            rounded
            dense
            style="max-width: 320px"
          />

          <div
            v-if="
              participantHistoryRows.length === 0 &&
              roomHistoryRows.length === 0
            "
            class="text-body2 text-grey-6"
          >
            {{ t('history.empty') }}
          </div>

          <template v-else>
            <div v-if="roomHistoryRows.length > 0">
              <div class="text-caption text-grey-7 q-mb-xs">
                {{ t('history.rooms') }}
              </div>
              <q-card
                flat
                bordered
                class="section-card"
              >
                <q-list separator>
                  <q-item
                    v-for="row in roomHistoryRows"
                    :key="row.id"
                  >
                    <q-item-section>
                      {{ row.name }}
                    </q-item-section>
                    <q-item-section side>
                      {{ t('history.count', { count: row.count }) }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </div>

            <div v-if="participantHistoryRows.length > 0">
              <div class="text-caption text-grey-7 q-mb-xs">
                {{ t('history.participants') }}
              </div>
              <q-card
                flat
                bordered
                class="section-card"
              >
                <q-list separator>
                  <q-item
                    v-for="row in participantHistoryRows"
                    :key="row.id"
                  >
                    <q-item-section>
                      {{ row.name }}
                    </q-item-section>
                    <q-item-section side>
                      {{ t('history.count', { count: row.count }) }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </div>
          </template>
        </div>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useDutyStore } from '@/stores/duty-store';
import { useDutyAssignmentStore } from '@/stores/duty-assignment-store';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { usePermissions } from '@/composables/permissions';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatPersonName } from '@/utils/formatters';
import { parseLocalDate } from '@/utils/date';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import DutyTypeDialog from '@/components/event/dutyPlanner/dialogs/DutyTypeDialog.vue';
import DutyAssignmentDialog from '@/components/event/dutyPlanner/dialogs/DutyAssignmentDialog.vue';
import type {
  Duty,
  DutyAssignment,
  DutyCreateData,
  DutyUpdateData,
  Registration,
  Room,
} from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const quasar = useQuasar();
const { t, d } = useI18n();
const apiService = useAPIService();
const dutyStore = useDutyStore();
const dutyAssignmentStore = useDutyAssignmentStore();
const registrationsStore = useRegistrationsStore();
const eventDetailsStore = useEventDetailsStore();
const registrationHelper = useRegistrationHelper();
const { to } = useObjectTranslation();
const { can } = usePermissions();

const showHistory = ref(false);

const locales = computed<string[] | undefined>(() => {
  return eventDetailsStore.data?.locales;
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
    dutyStore.fetchData(),
    dutyAssignmentStore.fetchData(),
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
    dutyStore.isLoading ||
    dutyAssignmentStore.isLoading ||
    roomsLoading.value
  );
});

const error = computed<string | null>(() => {
  return (
    registrationsStore.error ??
    dutyStore.error ??
    dutyAssignmentStore.error ??
    roomsError.value
  );
});

const duties = computed<Duty[]>(() => dutyStore.data ?? []);
const assignments = computed<DutyAssignment[]>(
  () => dutyAssignmentStore.data ?? [],
);
const registrations = computed<Registration[]>(
  () => registrationsStore.data ?? [],
);
const rooms = computed<Room[]>(() => roomsData.value ?? []);

const dutyOptions = computed<{ label: string; value: string }[]>(() => {
  return duties.value.map((duty) => ({ label: to(duty.name), value: duty.id }));
});

// Defaults to the first duty once duties load, but only until the user picks
// one themselves.
const historyDutyId = ref<string | null>(null);
watch(
  duties,
  (list) => {
    if (historyDutyId.value === null && list.length > 0) {
      historyDutyId.value = list[0]!.id;
    }
  },
  { immediate: true },
);

const canManageAssignments = computed<boolean>(() => {
  return (
    can('event.duty_assignments.edit') || can('event.duty_assignments.delete')
  );
});

const canManageDutyTypes = computed<boolean>(() => {
  return can('event.duties.edit') || can('event.duties.delete');
});

const groupedAssignments = computed<
  { date: string; items: DutyAssignment[] }[]
>(() => {
  const groups: { date: string; items: DutyAssignment[] }[] = [];

  for (const assignment of assignments.value) {
    const last = groups[groups.length - 1];
    if (last && last.date === assignment.date) {
      last.items.push(assignment);
    } else {
      groups.push({ date: assignment.date, items: [assignment] });
    }
  }

  return groups;
});

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
// with that room's name so a room-based duty reads as "Room 101: Alice, Bob"
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

function memberNames(assignment: DutyAssignment): string {
  const names = assignment.registrationIds
    .map((id) => registrationName(id) ?? t('unknownParticipant'))
    .join(', ');

  const roomName = commonRoomName(assignment.registrationIds);
  return roomName ? `${roomName}: ${names}` : names;
}

interface HistoryRow {
  id: string;
  name: string;
  count: number;
}

// Scoped to one duty at a time — mixing counts across unrelated duty types
// (Kitchen and Trash, say) into one total isn't actionable.
const historyAssignments = computed<DutyAssignment[]>(() => {
  return assignments.value.filter(
    (assignment) => assignment.dutyId === historyDutyId.value,
  );
});

// Only actual history (count > 0), ranked most-active first — this is a
// record of who has done the duty, not a full roster; "who hasn't yet" is
// already what the suggestion ranking surfaces when planning the next one.
const participantHistoryRows = computed<HistoryRow[]>(() => {
  const counts = new Map<string, number>();

  for (const assignment of historyAssignments.value) {
    for (const registrationId of assignment.registrationIds) {
      counts.set(registrationId, (counts.get(registrationId) ?? 0) + 1);
    }
  }

  return registrations.value
    .filter((registration) => counts.has(registration.id))
    .map((registration) => ({
      id: registration.id,
      name: formatPersonName(registrationHelper.uniqueName(registration)),
      count: counts.get(registration.id)!,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
});

// Mirrors the backend's ROOM suggestion ranking: a historical member's
// *current* room is what counts, so this stays correct as room assignments
// change over the camp. Each room counts at most once per occurrence,
// regardless of how many of its occupants were members that day.
const roomHistoryRows = computed<HistoryRow[]>(() => {
  const counts = new Map<string, number>();

  for (const assignment of historyAssignments.value) {
    const roomIds = new Set<string>();
    for (const registrationId of assignment.registrationIds) {
      const room = currentRoom(registrationId);
      if (room) {
        roomIds.add(room.id);
      }
    }
    for (const roomId of roomIds) {
      counts.set(roomId, (counts.get(roomId) ?? 0) + 1);
    }
  }

  return rooms.value
    .filter((room) => counts.has(room.id))
    .map((room) => ({
      id: room.id,
      name: to(room.name),
      count: counts.get(room.id)!,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
});

function assignmentLabel(assignment: DutyAssignment): string {
  const datePart = d(parseLocalDate(assignment.date), 'date');
  const dutyName = to(assignment.duty.name);
  return assignment.slot
    ? `${dutyName} — ${assignment.slot} (${datePart})`
    : `${dutyName} (${datePart})`;
}

function addDutyType() {
  quasar
    .dialog({
      component: DutyTypeDialog,
      componentProps: { locales: locales.value },
    })
    .onOk((payload: DutyCreateData) => {
      void dutyStore.createData(payload);
    });
}

function editDutyType(duty: Duty) {
  quasar
    .dialog({
      component: DutyTypeDialog,
      componentProps: { duty, locales: locales.value },
    })
    .onOk((payload: DutyUpdateData) => {
      void dutyStore.updateData(duty.id, payload);
    });
}

async function performDutyTypeDelete(duty: Duty) {
  await dutyStore.deleteData(duty.id);
  // Deleting a duty type cascades its assignments server-side; no
  // per-assignment realtime event fires for that, so refetch explicitly.
  dutyAssignmentStore.reset();
  await dutyAssignmentStore.fetchData();
}

function deleteDutyType(duty: Duty) {
  quasar
    .dialog({
      component: ConfirmDialog,
      componentProps: {
        title: t('dialog.deleteDuty.title'),
        message: t('dialog.deleteDuty.message', { name: to(duty.name) }),
        okLabel: t('action.delete'),
        color: 'negative',
      },
    })
    .onOk(() => {
      void performDutyTypeDelete(duty);
    });
}

function addAssignment() {
  quasar
    .dialog({
      component: DutyAssignmentDialog,
      componentProps: {
        duties: duties.value,
        registrations: registrations.value,
        rooms: rooms.value,
        locales: locales.value,
      },
    })
    .onOk((payload) => {
      void dutyAssignmentStore.createData(payload);
    });
}

function editAssignment(assignment: DutyAssignment) {
  quasar
    .dialog({
      component: DutyAssignmentDialog,
      componentProps: {
        assignment,
        duties: duties.value,
        registrations: registrations.value,
        rooms: rooms.value,
        locales: locales.value,
      },
    })
    .onOk((payload) => {
      void dutyAssignmentStore.updateData(assignment.id, payload);
    });
}

function deleteAssignment(assignment: DutyAssignment) {
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
      void dutyAssignmentStore.deleteData(assignment.id);
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
</style>

<i18n lang="yaml" locale="en">
title: 'Duty roster'
subtitle: 'Plan kitchen duty and other rotating chores.'
noMembers: 'No one assigned yet'
unknownParticipant: 'Unknown participant'

action:
  add: 'New assignment'
  addDutyType: 'Duty types'
  edit: 'Edit'
  delete: 'Delete'

hint:
  needDutyType: 'Create a duty type first'

empty:
  title: 'No duty types yet'
  message: 'Create a duty type — like Kitchen or Dishwashing — to start planning.'

emptyAssignments:
  title: 'No assignments yet'
  message: 'Plan the next duty to get started.'

dutyType:
  defaultCount: 'Usually {count} people'
  excludeStaff: 'Staff excluded'
  balanceCountries: 'Country-balanced'

history:
  toggle: 'Assignment history'
  dutyLabel: 'Duty'
  empty: 'No history yet for this duty.'
  count: '{count} time(s)'
  participants: 'Participants'
  rooms: 'Rooms'

dialog:
  deleteDuty:
    title: 'Delete duty type'
    message: 'Do you really want to delete "{name}"? All of its assignments will be deleted too.'
  deleteAssignment:
    title: 'Delete duty assignment'
    message: 'Do you really want to delete "{name}"?'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Dienstplan'
subtitle: 'Plane Küchendienst und andere rotierende Aufgaben.'
noMembers: 'Noch niemand zugewiesen'
unknownParticipant: 'Unbekannter Teilnehmer'

action:
  add: 'Neuer Einsatz'
  addDutyType: 'Diensttypen'
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

dutyType:
  defaultCount: 'Normalerweise {count} Personen'
  excludeStaff: 'Betreuende ausgeschlossen'
  balanceCountries: 'Länderausgleich'

history:
  toggle: 'Einsatzverlauf'
  dutyLabel: 'Dienst'
  empty: 'Noch keine Historie für diesen Dienst.'
  count: '{count} Mal'
  participants: 'Teilnehmende'
  rooms: 'Zimmer'

dialog:
  deleteDuty:
    title: 'Diensttyp löschen'
    message: 'Möchtest du „{name}" wirklich löschen? Alle zugehörigen Einsätze werden ebenfalls gelöscht.'
  deleteAssignment:
    title: 'Diensteinsatz löschen'
    message: 'Möchtest du „{name}" wirklich löschen?'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Plan des corvées'
subtitle: "Planifie la corvée de cuisine et d'autres tâches tournantes."
noMembers: 'Personne assigné pour le moment'
unknownParticipant: 'Participant inconnu'

action:
  add: 'Nouvelle affectation'
  addDutyType: 'Types de corvée'
  edit: 'Modifier'
  delete: 'Supprimer'

hint:
  needDutyType: "Crée d'abord un type de corvée"

empty:
  title: 'Aucun type de corvée pour le moment'
  message: 'Crée un type de corvée — comme Cuisine ou Vaisselle — pour commencer à planifier.'

emptyAssignments:
  title: 'Aucune affectation pour le moment'
  message: 'Planifie la prochaine corvée pour commencer.'

dutyType:
  defaultCount: 'Généralement {count} personnes'
  excludeStaff: 'Encadrement exclu'
  balanceCountries: 'Équilibre des pays'

history:
  toggle: 'Historique des affectations'
  dutyLabel: 'Corvée'
  empty: "Pas encore d'historique pour cette corvée."
  count: '{count} fois'
  participants: 'Participants'
  rooms: 'Chambres'

dialog:
  deleteDuty:
    title: 'Supprimer le type de corvée'
    message: 'Veux-tu vraiment supprimer « {name} » ? Toutes ses affectations seront également supprimées.'
  deleteAssignment:
    title: "Supprimer l'affectation de corvée"
    message: 'Veux-tu vraiment supprimer « {name} » ?'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Grafik dyżurów'
subtitle: 'Zaplanuj dyżur kuchenny i inne rotacyjne obowiązki.'
noMembers: 'Nikt jeszcze nie przypisany'
unknownParticipant: 'Nieznany uczestnik'

action:
  add: 'Nowe przypisanie'
  addDutyType: 'Rodzaje dyżurów'
  edit: 'Edytuj'
  delete: 'Usuń'

hint:
  needDutyType: 'Najpierw utwórz rodzaj dyżuru'

empty:
  title: 'Brak rodzajów dyżurów'
  message: 'Utwórz rodzaj dyżuru — np. Kuchnia lub Zmywanie — aby zacząć planowanie.'

emptyAssignments:
  title: 'Brak przypisań'
  message: 'Zaplanuj kolejny dyżur, aby zacząć.'

dutyType:
  defaultCount: 'Zwykle {count} osób'
  excludeStaff: 'Kadra wykluczona'
  balanceCountries: 'Równoważenie krajów'

history:
  toggle: 'Historia przypisań'
  dutyLabel: 'Dyżur'
  empty: 'Brak historii dla tego dyżuru.'
  count: '{count} razy'
  participants: 'Uczestnicy'
  rooms: 'Pokoje'

dialog:
  deleteDuty:
    title: 'Usuń rodzaj dyżuru'
    message: 'Czy na pewno chcesz usunąć „{name}"? Wszystkie jego przypisania również zostaną usunięte.'
  deleteAssignment:
    title: 'Usuń przypisanie dyżuru'
    message: 'Czy na pewno chcesz usunąć „{name}"?'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Rozpis služeb'
subtitle: 'Naplánuj kuchyňskou službu a další rotující povinnosti.'
noMembers: 'Zatím nikdo přiřazen'
unknownParticipant: 'Neznámý účastník'

action:
  add: 'Nové přiřazení'
  addDutyType: 'Typy služeb'
  edit: 'Upravit'
  delete: 'Smazat'

hint:
  needDutyType: 'Nejprve vytvoř typ služby'

empty:
  title: 'Zatím žádné typy služeb'
  message: 'Vytvoř typ služby — např. Kuchyně nebo Mytí nádobí — a začni plánovat.'

emptyAssignments:
  title: 'Zatím žádná přiřazení'
  message: 'Naplánuj další službu a začni.'

dutyType:
  defaultCount: 'Obvykle {count} lidí'
  excludeStaff: 'Vedoucí vyloučeni'
  balanceCountries: 'Vyvážení zemí'

history:
  toggle: 'Historie přiřazení'
  dutyLabel: 'Služba'
  empty: 'Zatím žádná historie pro tuto službu.'
  count: '{count}×'
  participants: 'Účastníci'
  rooms: 'Pokoje'

dialog:
  deleteDuty:
    title: 'Smazat typ služby'
    message: 'Opravdu chceš smazat „{name}"? Všechna jeho přiřazení budou také smazána.'
  deleteAssignment:
    title: 'Smazat přiřazení služby'
    message: 'Opravdu chceš smazat „{name}"?'
</i18n>
