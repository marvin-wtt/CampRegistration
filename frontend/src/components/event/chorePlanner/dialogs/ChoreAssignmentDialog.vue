<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <chore-dialog-card
      :title="isEdit ? t('title.edit') : t('title.create')"
      :width="600"
      @submit="onOKClick"
      @cancel="onDialogCancel"
    >
      <div class="q-gutter-y-md column no-wrap">
        <div class="row q-gutter-x-xs no-wrap">
          <q-select
            v-model="choreId"
            class="col"
            :label="t('field.chore.label')"
            :options="choreOptions"
            :rules="[(val) => !!val || t('field.chore.rule.required')]"
            map-options
            emit-value
            hide-bottom-space
            outlined
            rounded
            @update:model-value="onChoreChange"
          >
            <template #prepend>
              <q-icon name="checklist" />
            </template>
          </q-select>
          <q-btn
            v-if="can('event.chores.create')"
            round
            outline
            color="primary"
            icon="add"
            class="col-shrink self-center"
            :aria-label="t('action.addChore')"
            @click="addChore"
          >
            <q-tooltip>{{ t('action.addChore') }}</q-tooltip>
          </q-btn>
        </div>

        <div
          class="field-grid"
          :class="{ 'field-grid--2': slotOptions.length > 0 }"
        >
          <chore-date-input
            v-model="date"
            :label="t('field.date.label')"
          />
          <q-select
            v-if="slotOptions.length > 0"
            v-model="slotId"
            :label="t('field.slot.label')"
            :options="slotOptions"
            map-options
            emit-value
            outlined
            rounded
            @update:model-value="resetCounts"
          >
            <template #prepend>
              <q-icon name="schedule" />
            </template>
          </q-select>
        </div>

        <div v-if="hasRooms && selectedChore?.eligibility !== 'STAFF'">
          <div class="text-caption text-grey-7 q-mb-xs">
            {{ t('field.rotationUnit.label') }}
          </div>
          <q-btn-toggle
            v-model="rotationUnit"
            class="full-width compact-toggle"
            spread
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            :options="[
              {
                label: t('field.rotationUnit.option.PERSON'),
                value: 'PERSON',
                icon: 'person',
              },
              {
                label: t('field.rotationUnit.option.ROOM'),
                value: 'ROOM',
                icon: 'meeting_room',
              },
            ]"
          />
        </div>

        <!-- Members: how many people it needs, fair picks, then who is on it. -->
        <div class="section rounded-lg q-pa-sm column no-wrap q-gutter-y-sm">
          <div class="controls row items-center justify-between">
            <div class="controls row items-center no-wrap">
              <span class="text-body2">{{ t('field.headcount') }}</span>
              <chore-count-stepper
                v-model="headcount"
                :label="t('field.headcount')"
              />
            </div>
            <q-btn
              icon="auto_awesome"
              :label="t('action.autoFill')"
              color="primary"
              outline
              rounded
              no-caps
              :disable="!canAutoFill('MEMBER') && !canAutoFill('SUPERVISOR')"
              :loading="autoFilling"
              @click="autoFill"
            />
          </div>
          <div
            v-if="rotationUnit === 'ROOM'"
            class="text-caption text-grey-7"
          >
            {{ t('field.roomHint') }}
          </div>

          <div
            v-if="
              (memberSuggestions.length > 0 &&
                activeCount('MEMBER') < headcount) ||
              otherRooms.length > 0
            "
            class="controls row"
          >
            <template v-if="activeCount('MEMBER') < headcount">
              <q-chip
                v-for="candidate in memberSuggestions"
                :key="candidate.id"
                clickable
                outline
                color="primary"
                icon="add"
                @click="applySuggestion(candidate)"
              >
                {{ candidateLabel(candidate.id) }}
                <q-tooltip>{{ candidateHint(candidate) }}</q-tooltip>
              </q-chip>
            </template>
            <!-- Any other room, e.g. "Room 4 is on duty today". -->
            <q-chip
              v-if="otherRooms.length > 0"
              clickable
              outline
              icon="add"
            >
              {{ t('action.otherRoom') }}
              <q-menu>
                <q-list>
                  <q-item
                    v-for="room in otherRooms"
                    :key="room.id"
                    v-close-popup
                    clickable
                    @click="addMembers(roomMemberIds(room.id))"
                  >
                    <q-item-section>{{ room.label }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-chip>
          </div>

          <q-select
            v-model="memberIds"
            :label="t('field.members')"
            :hint="fillHint('MEMBER', headcount)"
            :options="memberOptions"
            map-options
            emit-value
            multiple
            use-chips
            use-input
            input-debounce="0"
            outlined
            rounded
            @filter="filterOptions"
          >
            <template #prepend>
              <q-icon name="groups" />
            </template>
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label
                    v-if="scope.opt.caption"
                    caption
                  >
                    {{ scope.opt.caption }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
            <template #selected-item="scope">
              <q-chip
                removable
                dense
                :class="{ 'member-missed': isMissed(scope.opt.value) }"
                @remove="scope.removeAtIndex(scope.index)"
              >
                {{ scope.opt.label }}
              </q-chip>
            </template>
          </q-select>
        </div>

        <!-- Supervisors: same order. -->
        <div
          v-if="showSupervisors"
          class="section rounded-lg q-pa-sm column no-wrap q-gutter-y-sm"
        >
          <div class="controls row items-center no-wrap">
            <span class="text-body2">{{ t('field.supervisorCount') }}</span>
            <chore-count-stepper
              v-model="supervisorCount"
              :label="t('field.supervisorCount')"
            />
          </div>
          <q-select
            v-model="supervisorIds"
            :label="t('field.supervisors')"
            :hint="fillHint('SUPERVISOR', supervisorCount)"
            :options="supervisorOptions"
            map-options
            emit-value
            multiple
            use-chips
            use-input
            input-debounce="0"
            outlined
            rounded
            @filter="filterOptions"
          >
            <template #prepend>
              <q-icon name="supervisor_account" />
            </template>
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label
                    v-if="scope.opt.caption"
                    caption
                  >
                    {{ scope.opt.caption }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
        <div v-else>
          <q-btn
            icon="supervisor_account"
            :label="t('action.addSupervisors')"
            color="primary"
            flat
            rounded
            no-caps
            @click="supervisorCount = 1"
          />
        </div>

        <div v-if="isEdit">
          <div class="text-caption text-grey-7 q-mb-xs">
            {{ t('field.status.label') }}
          </div>
          <q-btn-toggle
            v-model="status"
            class="full-width compact-toggle"
            spread
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            :options="statusOptions"
          />
        </div>

        <q-input
          v-model="note"
          type="textarea"
          autogrow
          maxlength="500"
          :label="t('field.note')"
          outlined
          rounded
        >
          <template #prepend>
            <q-icon name="sticky_note_2" />
          </template>
        </q-input>
      </div>

      <template #actions>
        <q-btn
          type="reset"
          outline
          rounded
          color="primary"
          :label="t('action.cancel')"
        />
        <q-btn
          type="submit"
          rounded
          color="primary"
          :label="isEdit ? t('action.save') : t('action.create')"
        />
      </template>
    </chore-dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import {
  type QSelectOption,
  useDialogPluginComponent,
  useQuasar,
} from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref, watch } from 'vue';
import type {
  Chore,
  ChoreAssignment,
  ChoreAssignmentCreateData,
  ChoreAssignmentMember,
  ChoreAssignmentStatus,
  ChoreAssignmentSuggestionCandidate,
  ChoreAssignmentUpdateData,
  ChoreBalance,
  ChoreCreateData,
  ChoreMemberRole,
  ChoreRotationUnit,
  Registration,
  Room,
} from '@camp-registration/common/entities';
import { useChoreStore } from '@/stores/chore-store';
import { useChoreAssignmentStore } from '@/stores/chore-assignment-store';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePermissions } from '@/composables/permissions';
import { formatPersonName } from '@/utils/formatters';
import { formatLocalDate } from '@/utils/date';
import { findSlot, requiredCount } from '@/utils/chores';
import ChoreDialog from '@/components/event/chorePlanner/dialogs/ChoreDialog.vue';
import ChoreDateInput from '@/components/event/chorePlanner/ChoreDateInput.vue';
import ChoreCountStepper from '@/components/event/chorePlanner/ChoreCountStepper.vue';
import ChoreDialogCard from '@/components/event/chorePlanner/ChoreDialogCard.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';

const SUGGESTION_CHIPS = 3;

const { t } = useI18n();
const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const choreStore = useChoreStore();
const choreAssignmentStore = useChoreAssignmentStore();
const registrationHelper = useRegistrationHelper();
const { to } = useObjectTranslation();
const { can } = usePermissions();

const props = defineProps<{
  assignment?: ChoreAssignment;
  chores: Chore[];
  registrations: Registration[];
  rooms: Room[];
  initialChoreId?: string;
  initialSlotId?: string | null;
  initialDate?: string;
  locales?: string[];
  countries?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const isEdit = computed<boolean>(() => props.assignment !== undefined);

const choreId = ref<string | null>(
  props.assignment?.choreId ??
    props.initialChoreId ??
    props.chores[0]?.id ??
    null,
);
// The chore store sees chores created from inside this dialog.
const chores = computed<Chore[]>(() => choreStore.data ?? props.chores);
const selectedChore = computed<Chore | undefined>(() =>
  chores.value.find((chore) => chore.id === choreId.value),
);

const date = ref<string | null>(
  props.assignment?.date ?? props.initialDate ?? formatLocalDate(new Date()),
);
const slotId = ref<string | null>(
  props.assignment?.slotId ?? props.initialSlotId ?? firstSlotId(),
);
const rotationUnit = ref<ChoreRotationUnit>(
  props.assignment?.rotationUnit ??
    selectedChore.value?.defaultRotationUnit ??
    'PERSON',
);
const status = ref<ChoreAssignmentStatus>(
  props.assignment?.status ?? 'PLANNED',
);
const note = ref<string>(props.assignment?.note ?? '');
const members = ref<ChoreAssignmentMember[]>(
  (props.assignment?.members ?? []).map((member) => ({ ...member })),
);
const needle = ref<string>('');

const selectedSlot = computed(() =>
  findSlot(selectedChore.value, slotId.value),
);

// Local to this duty — e.g. "we need three more today" — never saved.
const headcount = ref<number>(0);
const supervisorCount = ref<number>(0);

function resetCounts() {
  headcount.value = Math.max(
    requiredCount(selectedChore.value, selectedSlot.value, 'MEMBER'),
    activeCount('MEMBER'),
  );
  supervisorCount.value = Math.max(
    requiredCount(selectedChore.value, selectedSlot.value, 'SUPERVISOR'),
    activeCount('SUPERVISOR'),
  );
}
resetCounts();

function firstSlotId(): string | null {
  return selectedChore.value?.slots[0]?.id ?? null;
}

function onChoreChange() {
  slotId.value = firstSlotId();
  rotationUnit.value =
    selectedChore.value?.defaultRotationUnit ?? rotationUnit.value;
  resetCounts();
}

const choreOptions = computed<QSelectOption[]>(() =>
  chores.value.map((chore) => ({
    label: to(chore.name),
    value: chore.id,
  })),
);

const slotOptions = computed<QSelectOption<string | null>[]>(() => {
  const slots = selectedChore.value?.slots ?? [];
  if (slots.length === 0) {
    return [];
  }
  return [
    { label: t('field.slot.none'), value: null },
    ...slots.map((slot) => ({
      label: to(slot.name),
      value: slot.id,
    })),
  ];
});

const statusOptions = computed(() =>
  (['PLANNED', 'DONE', 'CANCELLED'] as const).map((value) => ({
    value,
    label: t(`status.${value}`),
  })),
);

const registrationById = computed(
  () => new Map(props.registrations.map((r) => [r.id, r])),
);

function isStaff(registration: Registration): boolean {
  return !registrationHelper.participant(registration);
}

function personLabel(registration: Registration): string {
  return formatPersonName(registrationHelper.uniqueName(registration));
}

const hasRooms = computed<boolean>(() =>
  props.rooms.some((room) => room.beds.some((bed) => bed.registrationId)),
);

function activeCount(role: ChoreMemberRole): number {
  return members.value.filter((m) => m.role === role && !m.missed).length;
}

// Shown under the field: how far along filling it is. Missed people don't
// count, as on the duty card.
function fillHint(role: ChoreMemberRole, target: number): string | undefined {
  if (target === 0) {
    return undefined;
  }
  const filled = activeCount(role);
  const params = { filled, total: target };
  if (filled > target) {
    return t('fill.over', { ...params, extra: filled - target });
  }
  if (filled === target) {
    return t('fill.full');
  }
  const missing = target - filled;
  return t('fill.open', { ...params, missing }, missing);
}

function isMissed(registrationId: string): boolean {
  return members.value.some(
    (m) => m.registrationId === registrationId && m.missed,
  );
}

// Keeps each person's stored flags when the selection changes.
function roleModel(role: ChoreMemberRole) {
  return computed<string[]>({
    get: () =>
      members.value
        .filter((member) => member.role === role)
        .map((member) => member.registrationId),
    set: (ids) => {
      const kept = members.value.filter(
        (member) => member.role !== role || ids.includes(member.registrationId),
      );
      const added = ids
        .filter((id) => !kept.some((member) => member.registrationId === id))
        .map((registrationId) => ({ registrationId, role, missed: false }));
      // Someone can't be both member and supervisor.
      members.value = [
        ...kept.filter(
          (member) =>
            member.role === role ||
            !added.some((a) => a.registrationId === member.registrationId),
        ),
        ...added,
      ];
    },
  });
}
const memberIds = roleModel('MEMBER');
const supervisorIds = roleModel('SUPERVISOR');

const showSupervisors = computed<boolean>(
  () => supervisorCount.value > 0 || supervisorIds.value.length > 0,
);

// Suggestions, fairest first — refetched when the duty's identity changes.
const memberSuggestionList = ref<ChoreAssignmentSuggestionCandidate[]>([]);
// What the lists were fetched for. Until a refetch lands they belong to the
// previous chore or unit — room ids must never be taken for people.
const suggestionsFor = ref<{
  choreId: string;
  date: string | null;
  unit: ChoreRotationUnit;
} | null>(null);
const suggestionsCurrent = computed<boolean>(
  () =>
    suggestionsFor.value?.choreId === choreId.value &&
    suggestionsFor.value?.date === (date.value ?? null) &&
    suggestionsFor.value?.unit === rotationUnit.value,
);
const participantStats = ref<Map<string, ChoreAssignmentSuggestionCandidate>>(
  new Map(),
);

let requestId = 0;
watch(
  [choreId, date, rotationUnit],
  async ([id, day, unit]) => {
    const current = ++requestId;
    if (!id) {
      return;
    }
    const base = {
      choreId: id,
      ...(day ? { date: day } : {}),
      ...(props.assignment ? { assignmentId: props.assignment.id } : {}),
    };
    const [memberResult, personResult, supervisorResult] = await Promise.all([
      choreAssignmentStore.fetchSuggestions({ ...base, unit, role: 'MEMBER' }),
      unit === 'ROOM'
        ? choreAssignmentStore.fetchSuggestions({
            ...base,
            unit: 'PERSON',
            role: 'MEMBER',
          })
        : undefined,
      choreAssignmentStore.fetchSuggestions({
        ...base,
        unit: 'PERSON',
        role: 'SUPERVISOR',
      }),
    ]);
    if (current !== requestId) {
      return;
    }
    memberSuggestionList.value = memberResult?.candidates ?? [];
    suggestionsFor.value = { choreId: id, date: day ?? null, unit };
    participantStats.value = new Map(
      [
        ...(personResult?.candidates ?? memberResult?.candidates ?? []),
        ...(supervisorResult?.candidates ?? []),
      ].map((candidate) => [candidate.id, candidate]),
    );
  },
  { immediate: true },
);

const selectedRoomIds = computed<Set<string>>(
  () =>
    new Set(
      memberIds.value.flatMap((id) => {
        const room = currentRoom(id);
        return room ? [room.id] : [];
      }),
    ),
);

const memberSuggestions = computed<ChoreAssignmentSuggestionCandidate[]>(() =>
  (suggestionsCurrent.value ? memberSuggestionList.value : [])
    .filter((candidate) =>
      rotationUnit.value === 'ROOM'
        ? !selectedRoomIds.value.has(candidate.id)
        : !memberIds.value.includes(candidate.id) &&
          !supervisorIds.value.includes(candidate.id),
    )
    .slice(0, SUGGESTION_CHIPS),
);

function balanceText(balance: ChoreBalance, busy: boolean): string {
  const text = t(`balance.${balance}`);
  return busy ? `${text} · ${t('busy')}` : text;
}

function candidateHint(candidate: ChoreAssignmentSuggestionCandidate): string {
  return balanceText(candidate.balance, candidate.busy);
}

function candidateLabel(id: string): string {
  if (rotationUnit.value === 'ROOM') {
    const room = props.rooms.find((value) => value.id === id);
    return room
      ? `${to(room.name)} · ${t('roomSize', roomMemberIds(id).length)}`
      : id;
  }
  const registration = registrationById.value.get(id);
  return registration ? personLabel(registration) : id;
}

function eligibleAsMember(registration: Registration): boolean {
  switch (selectedChore.value?.eligibility) {
    case 'STAFF':
      return isStaff(registration);
    case 'EVERYONE':
      return true;
    default:
      return !isStaff(registration);
  }
}

function personOptions(
  filter: (registration: Registration) => boolean,
  selected: string[],
): QSelectOption[] {
  return props.registrations
    .filter((registration) => registration.status === 'ACCEPTED')
    .filter(
      (registration) =>
        filter(registration) || selected.includes(registration.id),
    )
    .map((registration) => {
      const stat = participantStats.value.get(registration.id);
      return {
        label: personLabel(registration),
        value: registration.id,
        caption: stat ? balanceText(stat.balance, stat.busy) : undefined,
      };
    })
    .filter(
      (option) =>
        !needle.value || option.label.toLowerCase().includes(needle.value),
    )
    .sort((a, b) => a.label.localeCompare(b.label));
}

const memberOptions = computed(() =>
  personOptions(
    (registration) =>
      eligibleAsMember(registration) &&
      !supervisorIds.value.includes(registration.id),
    memberIds.value,
  ),
);

const supervisorOptions = computed(() =>
  personOptions(
    (registration) =>
      isStaff(registration) && !memberIds.value.includes(registration.id),
    supervisorIds.value,
  ),
);

function filterOptions(value: string, update: (fn: () => void) => void) {
  update(() => {
    needle.value = value.trim().toLowerCase();
  });
}

function currentRoom(registrationId: string): Room | undefined {
  return props.rooms.find((room) =>
    room.beds.some((bed) => bed.registrationId === registrationId),
  );
}

// Occupants who may do this duty — a mixed room never pulls in its staff.
function roomMemberIds(roomId: string): string[] {
  const room = props.rooms.find((value) => value.id === roomId);
  return (room?.beds ?? [])
    .map((bed) => bed.registrationId)
    .filter((id): id is string => !!id)
    .filter((id) => {
      const registration = registrationById.value.get(id);
      return registration ? eligibleAsMember(registration) : false;
    });
}

const roomOptions = computed<QSelectOption[]>(() =>
  props.rooms
    .filter((room) => roomMemberIds(room.id).length > 0)
    .map((room) => ({ label: to(room.name), value: room.id })),
);

const otherRooms = computed<{ id: string; label: string }[]>(() => {
  if (rotationUnit.value !== 'ROOM') {
    return [];
  }
  const shown = new Set(memberSuggestions.value.map((c) => c.id));
  return roomOptions.value
    .map((option) => String(option.value))
    .filter((id) => !shown.has(id) && !selectedRoomIds.value.has(id))
    .map((id) => ({ id, label: candidateLabel(id) }));
});

function addMembers(ids: string[]) {
  memberIds.value = [...new Set([...memberIds.value, ...ids])];
}

function applySuggestion(candidate: ChoreAssignmentSuggestionCandidate) {
  addMembers(
    rotationUnit.value === 'ROOM'
      ? roomMemberIds(candidate.id)
      : [candidate.id],
  );
}

function canAutoFill(role: ChoreMemberRole): boolean {
  const target = role === 'MEMBER' ? headcount.value : supervisorCount.value;
  return !!choreId.value && !!date.value && activeCount(role) < target;
}

const autoFilling = ref<boolean>(false);

// The server picks, so the dialog fills exactly like a series or a refill.
async function autoFill() {
  if (!choreId.value || !date.value) {
    return;
  }
  const requestedFor = [choreId.value, date.value, rotationUnit.value];
  autoFilling.value = true;
  try {
    const picks = await choreAssignmentStore.autoFillMembers({
      choreId: choreId.value,
      slotId: slotId.value,
      date: date.value,
      rotationUnit: rotationUnit.value,
      headcount: headcount.value,
      supervisorCount: supervisorCount.value,
      members: members.value,
      ...(props.assignment ? { assignmentId: props.assignment.id } : {}),
    });
    // Picked for another duty if it changed while waiting.
    if (
      requestedFor.join() !==
      [choreId.value, date.value, rotationUnit.value].join()
    ) {
      return;
    }
    const taken = new Set(members.value.map((m) => m.registrationId));
    members.value = [
      ...members.value,
      ...picks
        .filter((pick) => !taken.has(pick.registrationId))
        .map((pick) => ({
          registrationId: pick.registrationId,
          role: pick.role ?? 'MEMBER',
          missed: false,
        })),
    ];
  } finally {
    autoFilling.value = false;
  }
}

async function createChore(payload: ChoreCreateData) {
  const chore = await choreStore.createData(payload);
  if (chore) {
    choreId.value = chore.id;
    onChoreChange();
  }
}

function addChore() {
  quasar
    .dialog({
      component: ChoreDialog,
      componentProps: {
        locales: props.locales,
        countries: props.countries,
      },
    })
    .onOk((payload: ChoreCreateData) => {
      void createChore(payload);
    });
}

function onOKClick(): void {
  if (!choreId.value || !date.value) {
    return;
  }

  const common = {
    choreId: choreId.value,
    rotationUnit: rotationUnit.value,
    date: date.value,
    slotId: slotId.value,
    note: note.value.trim() || null,
    members: members.value,
  };
  const payload: ChoreAssignmentCreateData | ChoreAssignmentUpdateData =
    isEdit.value ? { ...common, status: status.value } : common;

  onDialogOK(payload);
}
</script>

<style scoped>
.section {
  border: 1px solid var(--md3-outline-variant);
}

.controls {
  gap: 8px;
}

.member-missed {
  text-decoration: line-through;
  opacity: 0.7;
}
</style>

<i18n lang="yaml" locale="en">
title:
  create: 'New duty'
  edit: 'Edit duty'

field:
  roomHint: 'By room: whole rooms are added until enough people are on it.'
  chore:
    label: 'Chore'
    rule:
      required: 'Pick a chore'
  date:
    label: 'Date'
  slot:
    label: 'Time slot'
    none: 'No time slot'
  rotationUnit:
    label: 'Assign by'
    option:
      PERSON: 'People'
      ROOM: 'Room'
  headcount: 'People needed'
  supervisorCount: 'Supervisors needed'
  members: 'People'
  supervisors: 'Supervisors'
  status:
    label: 'Status'
  note: 'Note for the team'

roomSize: '{n} person | {n} people'

fill:
  open: '{filled} of {total} filled · {missing} missing'
  over: '{filled} of {total} filled · {extra} too many'
  full: 'All spots filled'

status:
  PLANNED: 'Planned'
  DONE: 'Done'
  CANCELLED: 'Cancelled'

balance:
  BELOW: 'Less than average so far'
  AVERAGE: 'About average so far'
  ABOVE: 'More than average so far'
busy: 'already on a duty that day'

action:
  otherRoom: 'Other room'
  cancel: 'Cancel'
  create: 'Create'
  save: 'Save'
  addChore: 'New chore'
  autoFill: 'Fill fairly'
  addSupervisors: 'Add supervisors'
</i18n>

<i18n lang="yaml" locale="de">
title:
  create: 'Neuer Dienst'
  edit: 'Dienst bearbeiten'

field:
  roomHint: 'Nach Zimmer: Es kommen ganze Zimmer dazu, bis genug Personen dabei sind.'
  chore:
    label: 'Diensttyp'
    rule:
      required: 'Wähle einen Diensttyp'
  date:
    label: 'Datum'
  slot:
    label: 'Zeitfenster'
    none: 'Kein Zeitfenster'
  rotationUnit:
    label: 'Einteilen nach'
    option:
      PERSON: 'Personen'
      ROOM: 'Zimmer'
  headcount: 'Benötigte Personen'
  supervisorCount: 'Benötigte Aufsichten'
  members: 'Personen'
  supervisors: 'Aufsichten'
  status:
    label: 'Status'
  note: 'Notiz fürs Team'

roomSize: '{n} Person | {n} Personen'

fill:
  open: '{filled} von {total} besetzt · {missing} fehlt | {filled} von {total} besetzt · {missing} fehlen'
  over: '{filled} von {total} besetzt · {extra} zu viel'
  full: 'Alle Plätze besetzt'

status:
  PLANNED: 'Geplant'
  DONE: 'Erledigt'
  CANCELLED: 'Abgesagt'

balance:
  BELOW: 'Bisher weniger als der Durchschnitt'
  AVERAGE: 'Bisher etwa Durchschnitt'
  ABOVE: 'Bisher mehr als der Durchschnitt'
busy: 'an dem Tag schon im Dienst'

action:
  otherRoom: 'Weiteres Zimmer'
  cancel: 'Abbrechen'
  create: 'Erstellen'
  save: 'Speichern'
  addChore: 'Neuer Diensttyp'
  autoFill: 'Fair besetzen'
  addSupervisors: 'Aufsichten hinzufügen'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  create: 'Nouvelle corvée'
  edit: 'Modifier la corvée'

field:
  roomHint: 'Par chambre : des chambres entières sont ajoutées jusqu’à avoir assez de personnes.'
  chore:
    label: 'Corvée'
    rule:
      required: 'Choisis une corvée'
  date:
    label: 'Date'
  slot:
    label: 'Créneau'
    none: 'Aucun créneau'
  rotationUnit:
    label: 'Attribuer par'
    option:
      PERSON: 'Personnes'
      ROOM: 'Chambre'
  headcount: 'Personnes nécessaires'
  supervisorCount: 'Encadrants nécessaires'
  members: 'Personnes'
  supervisors: 'Encadrants'
  status:
    label: 'Statut'
  note: "Note pour l'équipe"

roomSize: '{n} personne | {n} personnes'

fill:
  open: '{filled} sur {total} pourvus · {missing} manquant | {filled} sur {total} pourvus · {missing} manquants'
  over: '{filled} sur {total} pourvus · {extra} en trop'
  full: 'Toutes les places sont prises'

status:
  PLANNED: 'Prévue'
  DONE: 'Faite'
  CANCELLED: 'Annulée'

balance:
  BELOW: 'Moins que la moyenne jusqu’ici'
  AVERAGE: 'Dans la moyenne jusqu’ici'
  ABOVE: 'Plus que la moyenne jusqu’ici'
busy: 'déjà de corvée ce jour-là'

action:
  otherRoom: 'Autre chambre'
  cancel: 'Annuler'
  create: 'Créer'
  save: 'Enregistrer'
  addChore: 'Nouvelle corvée'
  autoFill: 'Remplir équitablement'
  addSupervisors: 'Ajouter des encadrants'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  create: 'Nowy dyżur'
  edit: 'Edytuj dyżur'

field:
  roomHint: 'Według pokoju: dodawane są całe pokoje, aż będzie dość osób.'
  chore:
    label: 'Obowiązek'
    rule:
      required: 'Wybierz obowiązek'
  date:
    label: 'Data'
  slot:
    label: 'Przedział czasowy'
    none: 'Bez przedziału'
  rotationUnit:
    label: 'Przydziel według'
    option:
      PERSON: 'Osoby'
      ROOM: 'Pokój'
  headcount: 'Potrzebne osoby'
  supervisorCount: 'Potrzebni opiekunowie'
  members: 'Osoby'
  supervisors: 'Opiekunowie'
  status:
    label: 'Status'
  note: 'Notatka dla zespołu'

roomSize: '{n} osoba | {n} osoby'

fill:
  open: '{filled} z {total} obsadzonych · brakuje {missing}'
  over: '{filled} z {total} obsadzonych · {extra} za dużo'
  full: 'Wszystkie miejsca obsadzone'

status:
  PLANNED: 'Zaplanowany'
  DONE: 'Wykonany'
  CANCELLED: 'Odwołany'

balance:
  BELOW: 'Dotąd mniej niż średnio'
  AVERAGE: 'Dotąd około średniej'
  ABOVE: 'Dotąd więcej niż średnio'
busy: 'ma już dyżur tego dnia'

action:
  otherRoom: 'Inny pokój'
  cancel: 'Anuluj'
  create: 'Utwórz'
  save: 'Zapisz'
  addChore: 'Nowy obowiązek'
  autoFill: 'Obsadź sprawiedliwie'
  addSupervisors: 'Dodaj opiekunów'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  create: 'Nová služba'
  edit: 'Upravit službu'

field:
  roomHint: 'Podle pokoje: přidávají se celé pokoje, dokud není dost lidí.'
  chore:
    label: 'Povinnost'
    rule:
      required: 'Vyber povinnost'
  date:
    label: 'Datum'
  slot:
    label: 'Časový blok'
    none: 'Bez časového bloku'
  rotationUnit:
    label: 'Přiřadit podle'
    option:
      PERSON: 'Lidé'
      ROOM: 'Pokoj'
  headcount: 'Potřebný počet lidí'
  supervisorCount: 'Potřebný dozor'
  members: 'Lidé'
  supervisors: 'Dozor'
  status:
    label: 'Stav'
  note: 'Poznámka pro tým'

roomSize: '{n} osoba | {n} osoby'

fill:
  open: '{filled} z {total} obsazeno · chybí {missing}'
  over: '{filled} z {total} obsazeno · {extra} navíc'
  full: 'Všechna místa obsazena'

status:
  PLANNED: 'Naplánováno'
  DONE: 'Hotovo'
  CANCELLED: 'Zrušeno'

balance:
  BELOW: 'Zatím méně než průměr'
  AVERAGE: 'Zatím zhruba průměr'
  ABOVE: 'Zatím více než průměr'
busy: 'ten den už má službu'

action:
  otherRoom: 'Jiný pokoj'
  cancel: 'Zrušit'
  create: 'Vytvořit'
  save: 'Uložit'
  addChore: 'Nová povinnost'
  autoFill: 'Obsadit spravedlivě'
  addSupervisors: 'Přidat dozor'
</i18n>
