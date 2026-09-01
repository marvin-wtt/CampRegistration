<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin assignment-card q-pb-none">
      <q-form
        @submit="onOKClick"
        @reset="onDialogCancel"
      >
        <q-card-section>
          <div class="text-h5 text-center">
            {{ isEdit ? t('title.edit') : t('title.create') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <div class="row q-gutter-x-xs no-wrap">
            <q-select
              v-model="dutyId"
              class="col"
              :label="t('field.duty.label')"
              :options="dutyOptions"
              :rules="[(val) => !!val || t('field.duty.rule.required')]"
              map-options
              emit-value
              hide-bottom-space
              outlined
              rounded
            >
              <template #prepend>
                <q-icon name="checklist" />
              </template>
            </q-select>
            <q-btn
              round
              outline
              color="primary"
              icon="add"
              class="col-shrink"
              :aria-label="t('action.addDutyType')"
              @click="addDutyType"
            >
              <q-tooltip>{{ t('action.addDutyType') }}</q-tooltip>
            </q-btn>
          </div>

          <q-input
            v-model="date"
            :label="t('field.date.label')"
            :rules="[
              (val?: string) => !!val?.length || t('field.date.rule.required'),
            ]"
            hide-bottom-space
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="calendar_month" />
            </template>
            <template #append>
              <q-icon
                name="event"
                class="cursor-pointer"
              >
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date
                    v-model="date"
                    mask="YYYY-MM-DD"
                  >
                    <div class="row items-center justify-end">
                      <q-btn
                        v-close-popup
                        :label="t('action.close')"
                        color="primary"
                        flat
                        rounded
                      />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-select
            v-model="slot"
            :label="t('field.slot.label')"
            :hint="t('field.slot.hint')"
            :options="filteredSlotOptions"
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            clearable
            outlined
            rounded
            @filter="filterSlotOptions"
            @input-value="(val: string) => (slot = val)"
          >
            <template #prepend>
              <q-icon name="schedule" />
            </template>
          </q-select>

          <div v-if="roomOptions.length > 0 || rotationUnit == 'ROOM'">
            <div class="text-caption text-grey-7 q-mb-xs">
              {{ t('field.rotationUnit.label') }}
            </div>
            <q-btn-toggle
              v-model="rotationUnit"
              no-caps
              rounded
              toggle-color="primary"
              color="white"
              text-color="primary"
              :options="[
                {
                  label: t('field.rotationUnit.option.PARTICIPANT'),
                  value: 'PARTICIPANT',
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

          <div
            v-if="suggestedCandidates.length > 0"
            class="suggestions"
          >
            <div class="text-caption text-grey-7">
              {{ t('suggestions.title') }}
            </div>
            <div class="row q-gutter-xs q-mt-xs">
              <q-chip
                v-for="candidate in suggestedCandidates"
                :key="candidate.id"
                clickable
                outline
                color="primary"
                icon="auto_awesome"
                @click="applySuggestion(candidate)"
              >
                {{ candidateChipLabel(candidate) }}
              </q-chip>
            </div>
          </div>

          <div
            v-if="rotationUnit === 'ROOM'"
            class="row items-end q-gutter-x-xs no-wrap"
          >
            <q-select
              v-model="roomToAdd"
              class="col"
              :label="t('field.addRoom.label')"
              :options="roomOptions"
              map-options
              emit-value
              clearable
              outlined
              rounded
              dense
            >
              <template #prepend>
                <q-icon name="meeting_room" />
              </template>
            </q-select>
            <q-btn
              outline
              rounded
              color="primary"
              :label="t('action.addRoom')"
              :disable="!roomToAdd"
              @click="addRoomMembers"
            />
          </div>

          <q-select
            v-model="registrationIds"
            :label="t('field.members.label')"
            :options="participantOptions"
            map-options
            emit-value
            multiple
            use-chips
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="groups" />
            </template>
          </q-select>
        </q-card-section>

        <!-- action buttons -->
        <q-card-actions align="right">
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
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
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
  Duty,
  DutyAssignment,
  DutyAssignmentCreateData,
  DutyAssignmentSuggestionCandidate,
  DutyAssignmentUpdateData,
  DutyCreateData,
  DutyRotationUnit,
  Registration,
  Room,
} from '@camp-registration/common/entities';
import { useDutyStore } from '@/stores/duty-store';
import { useDutyAssignmentStore } from '@/stores/duty-assignment-store';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatPersonName } from '@/utils/formatters';
import { formatLocalDate } from '@/utils/date';
import DutyTypeDialog from '@/components/event/dutyPlanner/dialogs/DutyTypeDialog.vue';

const DEFAULT_SUGGESTION_COUNT = 5;

const { t } = useI18n();
const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const dutyStore = useDutyStore();
const dutyAssignmentStore = useDutyAssignmentStore();
const registrationHelper = useRegistrationHelper();
const { to } = useObjectTranslation();

const props = defineProps<{
  assignment?: DutyAssignment;
  duties: Duty[];
  registrations: Registration[];
  rooms: Room[];
  initialDutyId?: string;
  locales?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const isEdit = computed<boolean>(() => props.assignment !== undefined);

const dutyId = ref<string | null>(
  props.assignment?.dutyId ??
    props.initialDutyId ??
    props.duties[0]?.id ??
    null,
);
const rotationUnit = ref<DutyRotationUnit>(
  props.assignment?.rotationUnit ?? defaultRotationUnit(),
);
const date = ref<string>(props.assignment?.date ?? formatLocalDate(new Date()));
const slot = ref<string | null>(props.assignment?.slot ?? null);
const registrationIds = ref<string[]>([
  ...(props.assignment?.registrationIds ?? []),
]);
const roomToAdd = ref<string | null>(null);

// Both units' suggestion lists are fetched once per selected duty (not per
// toggle flip) — the PARTICIPANT list is always needed to annotate the
// participant dropdown with "how often already", regardless of which unit is
// currently toggled, and keeping both cached means flipping the toggle never
// triggers a fetch (so there's nothing async left to race).
const participantSuggestions = ref<DutyAssignmentSuggestionCandidate[]>([]);
const roomSuggestions = ref<DutyAssignmentSuggestionCandidate[]>([]);

const selectedDuty = computed<Duty | undefined>(() => {
  return props.duties.find((duty) => duty.id === dutyId.value);
});

const dutyOptions = computed<QSelectOption[]>(() => {
  return props.duties.map((duty) => ({ label: to(duty.name), value: duty.id }));
});

function defaultRotationUnit(): DutyRotationUnit {
  // Mirrors roomOptions' filtering (occupied, not staff-only per the selected
  // duty) rather than reading that computed directly — it isn't declared yet
  // at this point in setup, since its value seeds this ref's initializer.
  const duty = props.duties.find((d) => d.id === dutyId.value);
  const excludeStaff = duty?.excludeStaff ?? false;
  const hasAssignableRoom = props.rooms
    .filter(hasOccupants)
    .some((room) => !excludeStaff || !isStaffOnlyRoom(room));
  return hasAssignableRoom ? 'ROOM' : 'PARTICIPANT';
}

function participantStat(
  id: string,
): DutyAssignmentSuggestionCandidate | undefined {
  return participantSuggestions.value.find((candidate) => candidate.id === id);
}

function roomStat(id: string): DutyAssignmentSuggestionCandidate | undefined {
  return roomSuggestions.value.find((candidate) => candidate.id === id);
}

function hasOccupants(room: Room): boolean {
  return room.beds.some((bed) => bed.registrationId !== null);
}

// A room dedicated to staff: it has occupants, and none of them is a
// participant. Mirrors the backend's suggestion filter — see
// dutyAssignment.service.ts.
function isStaffOnlyRoom(room: Room): boolean {
  const occupants = room.beds
    .map((bed) => bed.registrationId)
    .filter((id): id is string => id !== null)
    .map((id) =>
      props.registrations.find((registration) => registration.id === id),
    )
    .filter((registration): registration is Registration => !!registration);

  return (
    occupants.length > 0 &&
    occupants.every(
      (registration) => !registrationHelper.participant(registration),
    )
  );
}

const participantOptions = computed<QSelectOption[]>(() => {
  const excludeStaff = selectedDuty.value?.excludeStaff ?? false;

  return props.registrations
    .filter((registration) => registration.status === 'ACCEPTED')
    .filter(
      (registration) =>
        !excludeStaff ||
        registrationHelper.participant(registration) ||
        registrationIds.value.includes(registration.id),
    )
    .map((registration) => {
      const stat = participantStat(registration.id);
      return {
        label: stat
          ? t('suggestions.candidate', {
              name: memberLabel(registration),
              count: stat.assignmentCount,
            })
          : memberLabel(registration),
        value: registration.id,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
});

const roomOptions = computed<QSelectOption[]>(() => {
  const excludeStaff = selectedDuty.value?.excludeStaff ?? false;

  return props.rooms
    .filter((room) => hasOccupants(room))
    .filter((room) => !excludeStaff || !isStaffOnlyRoom(room))
    .map((room) => {
      const stat = roomStat(room.id);
      return {
        label: stat
          ? t('suggestions.candidate', {
              name: to(room.name),
              count: stat.assignmentCount,
            })
          : to(room.name),
        value: room.id,
        sortOrder: room.sortOrder,
      };
    })
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
    );
});

// Distinct current rooms already represented among the selected members —
// how "many rooms worth" of people are already in, for ROOM sizing.
const selectedRoomIds = computed<Set<string>>(() => {
  const ids = new Set<string>();
  for (const registrationId of registrationIds.value) {
    const room = currentRoom(registrationId);
    if (room) {
      ids.add(room.id);
    }
  }
  return ids;
});

// How many more people the duty's usual size still calls for, given who's
// already selected — tracks the input live. Null means no usual size is set
// (falls back to a flat suggestion count instead of sizing). The target is
// always a headcount, for both units — see `suggestedCandidates` for how
// that's turned into a number of *rooms* when assigning by room.
const remainingHeadcount = computed<number | null>(() => {
  const target = selectedDuty.value?.defaultCount;
  if (target == null) {
    return null;
  }

  return Math.max(target - registrationIds.value.length, 0);
});

const suggestedCandidates = computed<DutyAssignmentSuggestionCandidate[]>(
  () => {
    if (rotationUnit.value === 'ROOM') {
      const available = roomSuggestions.value.filter(
        (candidate) => !selectedRoomIds.value.has(candidate.id),
      );

      if (remainingHeadcount.value === null) {
        return available.slice(0, DEFAULT_SUGGESTION_COUNT);
      }

      // Basic bin-covering, not exact bin-packing: walk the fairness-ranked
      // list in order (never reordered by size — fairness stays primary) and
      // keep adding rooms, using each one's *current* occupancy, until
      // enough rooms have been suggested to plausibly cover what's still
      // needed. A duty needing 4 people suggests one room of 4, or two of 2,
      // rather than a fixed chip count that ignores how big rooms actually are.
      const picked: DutyAssignmentSuggestionCandidate[] = [];
      let covered = 0;
      for (const candidate of available) {
        if (covered >= remainingHeadcount.value) {
          break;
        }
        picked.push(candidate);
        covered += Math.max(roomMemberIds(candidate.id).length, 1);
      }
      return picked;
    }

    const available = participantSuggestions.value.filter(
      (candidate) => !registrationIds.value.includes(candidate.id),
    );

    return available.slice(
      0,
      remainingHeadcount.value ?? DEFAULT_SUGGESTION_COUNT,
    );
  },
);

// Only the latest request's result is ever applied — switching duty again
// before a slower response lands must not let it clobber the newer one.
let suggestionRequestId = 0;
watch(
  dutyId,
  async (id) => {
    const requestId = ++suggestionRequestId;
    participantSuggestions.value = [];
    roomSuggestions.value = [];
    if (!id) {
      return;
    }

    const [participantResult, roomResult] = await Promise.all([
      dutyAssignmentStore.fetchSuggestions(id, 'PARTICIPANT'),
      dutyAssignmentStore.fetchSuggestions(id, 'ROOM'),
    ]);
    if (requestId !== suggestionRequestId) {
      return;
    }

    participantSuggestions.value = participantResult?.candidates ?? [];
    roomSuggestions.value = roomResult?.candidates ?? [];
  },
  { immediate: true },
);

// Past slot labels used for this duty — e.g. Kitchen's recurring
// "Breakfast"/"Lunch"/"Dinner" — so creating the next occurrence is a pick,
// not a retype. Free text is still allowed.
const pastSlots = computed<string[]>(() => {
  const counts = new Map<string, number>();
  for (const existing of dutyAssignmentStore.data ?? []) {
    if (existing.dutyId !== dutyId.value || !existing.slot) {
      continue;
    }
    counts.set(existing.slot, (counts.get(existing.slot) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value]) => value);
});

const filteredSlotOptions = ref<string[]>([]);

function filterSlotOptions(
  inputValue: string,
  update: (callback: () => void) => void,
) {
  update(() => {
    const needle = inputValue.trim().toLowerCase();
    filteredSlotOptions.value = needle
      ? pastSlots.value.filter((value) => value.toLowerCase().includes(needle))
      : pastSlots.value;
  });
}

function memberLabel(registration: Registration): string {
  return formatPersonName(registrationHelper.uniqueName(registration));
}

function candidateLabel(id: string): string {
  if (rotationUnit.value === 'ROOM') {
    const room = props.rooms.find((value) => value.id === id);
    return room ? to(room.name) : id;
  }

  const registration = props.registrations.find((value) => value.id === id);
  return registration ? memberLabel(registration) : id;
}

function candidateChipLabel(
  candidate: DutyAssignmentSuggestionCandidate,
): string {
  return t('suggestions.candidate', {
    name: candidateLabel(candidate.id),
    count: candidate.assignmentCount,
  });
}

function currentRoom(registrationId: string): Room | undefined {
  return props.rooms.find((room) =>
    room.beds.some((bed) => bed.registrationId === registrationId),
  );
}

// A room isn't excluded from selection unless *every* occupant is staff (see
// isStaffOnlyRoom), so a mixed room can still be picked — but bulk-adding it
// must not silently pull its staff occupants in when this duty excludes staff.
function roomMemberIds(roomId: string): string[] {
  const room = props.rooms.find((value) => value.id === roomId);
  if (!room) {
    return [];
  }

  const excludeStaff = selectedDuty.value?.excludeStaff ?? false;

  return room.beds
    .map((bed) => bed.registrationId)
    .filter((id): id is string => id !== null)
    .filter((id) => {
      if (!excludeStaff) {
        return true;
      }
      const registration = props.registrations.find((value) => value.id === id);
      return registration ? registrationHelper.participant(registration) : true;
    });
}

function applySuggestion(candidate: DutyAssignmentSuggestionCandidate) {
  const ids =
    rotationUnit.value === 'ROOM'
      ? roomMemberIds(candidate.id)
      : [candidate.id];

  registrationIds.value = [...new Set([...registrationIds.value, ...ids])];
}

function addRoomMembers() {
  if (!roomToAdd.value) {
    return;
  }

  registrationIds.value = [
    ...new Set([...registrationIds.value, ...roomMemberIds(roomToAdd.value)]),
  ];
  roomToAdd.value = null;
}

async function createDutyType(payload: DutyCreateData) {
  const duty = await dutyStore.createData(payload);
  if (duty) {
    dutyId.value = duty.id;
  }
}

function addDutyType() {
  quasar
    .dialog({
      component: DutyTypeDialog,
      componentProps: {
        locales: props.locales,
      },
    })
    .onOk((payload: DutyCreateData) => {
      void createDutyType(payload);
    });
}

function onOKClick(): void {
  // The duty select has a required rule, so the form can't submit without it.
  if (!dutyId.value) {
    return;
  }

  const payload: DutyAssignmentCreateData | DutyAssignmentUpdateData = {
    dutyId: dutyId.value,
    rotationUnit: rotationUnit.value,
    date: date.value,
    slot: slot.value?.trim() ? slot.value.trim() : null,
    registrationIds: registrationIds.value,
  };

  onDialogOK(payload);
}
</script>

<style scoped>
.assignment-card {
  min-width: min(480px, 90vw);
}

.suggestions {
  padding: 8px 0;
}
</style>

<i18n lang="yaml" locale="en">
title:
  create: 'New duty assignment'
  edit: 'Edit duty assignment'

field:
  duty:
    label: 'Duty'
    rule:
      required: 'Pick a duty'
  rotationUnit:
    label: 'Assign by'
    option:
      PARTICIPANT: 'Participants'
      ROOM: 'Room'
  date:
    label: 'Date'
    rule:
      required: 'The date is required'
  slot:
    label: 'Slot'
    hint: 'Optional, e.g. Breakfast, Lunch, Dinner'
  members:
    label: 'Participants'
  addRoom:
    label: 'Add whole room'

suggestions:
  title: 'Suggested — next in rotation'
  candidate: '{name} ({count}×)'

action:
  cancel: 'Cancel'
  close: 'Close'
  create: 'Create'
  save: 'Save'
  addDutyType: 'New duty type'
  addRoom: 'Add'
</i18n>

<i18n lang="yaml" locale="de">
title:
  create: 'Neuer Diensteinsatz'
  edit: 'Diensteinsatz bearbeiten'

field:
  duty:
    label: 'Dienst'
    rule:
      required: 'Bitte einen Dienst wählen'
  rotationUnit:
    label: 'Zuweisen nach'
    option:
      PARTICIPANT: 'Teilnehmenden'
      ROOM: 'Zimmer'
  date:
    label: 'Datum'
    rule:
      required: 'Das Datum ist erforderlich'
  slot:
    label: 'Zeitfenster'
    hint: 'Optional, z. B. Frühstück, Mittagessen, Abendessen'
  members:
    label: 'Teilnehmende'
  addRoom:
    label: 'Ganzes Zimmer hinzufügen'

suggestions:
  title: 'Vorschlag — als Nächstes an der Reihe'
  candidate: '{name} ({count}×)'

action:
  cancel: 'Abbrechen'
  close: 'Schließen'
  create: 'Erstellen'
  save: 'Speichern'
  addDutyType: 'Neuer Diensttyp'
  addRoom: 'Hinzufügen'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  create: 'Nouvelle affectation de corvée'
  edit: "Modifier l'affectation de corvée"

field:
  duty:
    label: 'Corvée'
    rule:
      required: 'Choisis une corvée'
  rotationUnit:
    label: 'Affecter par'
    option:
      PARTICIPANT: 'Participants'
      ROOM: 'Chambre'
  date:
    label: 'Date'
    rule:
      required: 'La date est requise'
  slot:
    label: 'Créneau'
    hint: 'Facultatif, p. ex. Petit-déjeuner, Déjeuner, Dîner'
  members:
    label: 'Participants'
  addRoom:
    label: 'Ajouter toute la chambre'

suggestions:
  title: 'Suggestion — prochain tour'
  candidate: '{name} ({count}×)'

action:
  cancel: 'Annuler'
  close: 'Fermer'
  create: 'Créer'
  save: 'Enregistrer'
  addDutyType: 'Nouveau type de corvée'
  addRoom: 'Ajouter'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  create: 'Nowe przypisanie dyżuru'
  edit: 'Edytuj przypisanie dyżuru'

field:
  duty:
    label: 'Dyżur'
    rule:
      required: 'Wybierz dyżur'
  rotationUnit:
    label: 'Przypisz według'
    option:
      PARTICIPANT: 'Uczestników'
      ROOM: 'Pokoju'
  date:
    label: 'Data'
    rule:
      required: 'Data jest wymagana'
  slot:
    label: 'Termin'
    hint: 'Opcjonalne, np. Śniadanie, Obiad, Kolacja'
  members:
    label: 'Uczestnicy'
  addRoom:
    label: 'Dodaj cały pokój'

suggestions:
  title: 'Sugestia — kolejny w kolejce'
  candidate: '{name} ({count}×)'

action:
  cancel: 'Anuluj'
  close: 'Zamknij'
  create: 'Utwórz'
  save: 'Zapisz'
  addDutyType: 'Nowy rodzaj dyżuru'
  addRoom: 'Dodaj'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  create: 'Nové přiřazení služby'
  edit: 'Upravit přiřazení služby'

field:
  duty:
    label: 'Služba'
    rule:
      required: 'Vyber službu'
  rotationUnit:
    label: 'Přiřadit podle'
    option:
      PARTICIPANT: 'Účastníků'
      ROOM: 'Pokoje'
  date:
    label: 'Datum'
    rule:
      required: 'Datum je povinné'
  slot:
    label: 'Termín'
    hint: 'Volitelné, např. Snídaně, Oběd, Večeře'
  members:
    label: 'Účastníci'
  addRoom:
    label: 'Přidat celý pokoj'

suggestions:
  title: 'Návrh — další na řadě'
  candidate: '{name} ({count}×)'

action:
  cancel: 'Zrušit'
  close: 'Zavřít'
  create: 'Vytvořit'
  save: 'Uložit'
  addDutyType: 'Nový typ služby'
  addRoom: 'Přidat'
</i18n>
