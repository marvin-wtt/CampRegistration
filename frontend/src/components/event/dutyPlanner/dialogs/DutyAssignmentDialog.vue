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

          <q-input
            v-model="slot"
            :label="t('field.slot.label')"
            :hint="t('field.slot.hint')"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="schedule" />
            </template>
          </q-input>

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

          <div
            v-if="selectedDuty?.rotationUnit === 'ROOM'"
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
const date = ref<string>(props.assignment?.date ?? formatLocalDate(new Date()));
const slot = ref<string | null>(props.assignment?.slot ?? null);
const registrationIds = ref<string[]>([
  ...(props.assignment?.registrationIds ?? []),
]);
const roomToAdd = ref<string | null>(null);
const suggestions = ref<DutyAssignmentSuggestionCandidate[]>([]);

const selectedDuty = computed<Duty | undefined>(() => {
  return props.duties.find((duty) => duty.id === dutyId.value);
});

// Derived synchronously from the selected duty rather than the async
// suggestions response — the response can arrive out of order (a slower
// ROOM query started earlier resolving after a faster PARTICIPANT one),
// which would otherwise show the wrong kind of suggestion.
const suggestionUnit = computed<'PARTICIPANT' | 'ROOM'>(() => {
  return selectedDuty.value?.rotationUnit ?? 'PARTICIPANT';
});

const dutyOptions = computed<QSelectOption[]>(() => {
  return props.duties.map((duty) => ({ label: to(duty.name), value: duty.id }));
});

const participantOptions = computed<QSelectOption[]>(() => {
  return props.registrations
    .filter((registration) => registration.status === 'ACCEPTED')
    .map((registration) => ({
      label: memberLabel(registration),
      value: registration.id,
    }));
});

const roomOptions = computed<QSelectOption[]>(() => {
  return props.rooms.map((room) => ({ label: to(room.name), value: room.id }));
});

const suggestedCandidates = computed<DutyAssignmentSuggestionCandidate[]>(
  () => {
    if (suggestionUnit.value === 'PARTICIPANT') {
      return suggestions.value
        .filter((candidate) => !registrationIds.value.includes(candidate.id))
        .slice(0, 5);
    }

    return suggestions.value.slice(0, 5);
  },
);

// Guards against out-of-order responses: only the latest request's result is
// ever applied, and only fills the members list when it's still empty (so it
// never clobbers a manual selection).
let suggestionRequestId = 0;
watch(
  dutyId,
  async (id) => {
    const requestId = ++suggestionRequestId;
    suggestions.value = [];
    if (!id) {
      return;
    }

    const result = await dutyAssignmentStore.fetchSuggestions(id);
    if (requestId !== suggestionRequestId || !result) {
      return;
    }

    suggestions.value = result.candidates;

    const duty = props.duties.find((value) => value.id === id);
    if (
      result.unit === 'PARTICIPANT' &&
      duty?.defaultCount &&
      registrationIds.value.length === 0
    ) {
      registrationIds.value = result.candidates
        .slice(0, duty.defaultCount)
        .map((candidate) => candidate.id);
    }
  },
  { immediate: true },
);

function memberLabel(registration: Registration): string {
  return formatPersonName(registrationHelper.uniqueName(registration));
}

function candidateLabel(id: string): string {
  if (suggestionUnit.value === 'ROOM') {
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

function roomMemberIds(roomId: string): string[] {
  const room = props.rooms.find((value) => value.id === roomId);
  if (!room) {
    return [];
  }

  return room.beds
    .map((bed) => bed.registrationId)
    .filter((id): id is string => id !== null);
}

function applySuggestion(candidate: DutyAssignmentSuggestionCandidate) {
  const ids =
    suggestionUnit.value === 'ROOM'
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
