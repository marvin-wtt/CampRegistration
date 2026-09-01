<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin history-card">
      <q-card-section class="row items-center justify-between no-wrap">
        <div class="text-h6">{{ t('title') }}</div>
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
          :aria-label="t('action.close')"
        />
      </q-card-section>

      <q-card-section class="q-pt-none column q-gutter-y-sm">
        <q-select
          v-model="historyDutyId"
          :label="t('dutyLabel')"
          :options="dutyOptions"
          map-options
          emit-value
          outlined
          rounded
          dense
        />

        <div
          v-if="
            participantHistoryRows.length === 0 && roomHistoryRows.length === 0
          "
          class="text-body2 text-grey-6"
        >
          {{ t('empty') }}
        </div>

        <template v-else>
          <div v-if="roomHistoryRows.length > 0">
            <div class="text-caption text-grey-7 q-mb-xs">
              {{ t('rooms') }}
            </div>
            <q-card
              flat
              bordered
              class="section-card"
            >
              <q-list separator>
                <q-expansion-item
                  v-for="row in roomHistoryRows"
                  :key="row.id"
                  dense
                  dense-toggle
                >
                  <template #header>
                    <q-item-section>{{ row.name }}</q-item-section>
                    <q-item-section side>
                      {{ t('count', { count: row.count }) }}
                    </q-item-section>
                  </template>
                  <q-list class="occurrence-list">
                    <q-item
                      v-for="(occurrence, index) in row.occurrences"
                      :key="index"
                      dense
                    >
                      <q-item-section>
                        {{ occurrenceLabel(occurrence) }}
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-expansion-item>
              </q-list>
            </q-card>
          </div>

          <div v-if="participantHistoryRows.length > 0">
            <div class="text-caption text-grey-7 q-mb-xs">
              {{ t('participants') }}
            </div>
            <q-card
              flat
              bordered
              class="section-card"
            >
              <q-list separator>
                <q-expansion-item
                  v-for="row in participantHistoryRows"
                  :key="row.id"
                  dense
                  dense-toggle
                >
                  <template #header>
                    <q-item-section>{{ row.name }}</q-item-section>
                    <q-item-section side>
                      {{ t('count', { count: row.count }) }}
                    </q-item-section>
                  </template>
                  <q-list class="occurrence-list">
                    <q-item
                      v-for="(occurrence, index) in row.occurrences"
                      :key="index"
                      dense
                    >
                      <q-item-section>
                        {{ occurrenceLabel(occurrence) }}
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-expansion-item>
              </q-list>
            </q-card>
          </div>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { type QSelectOption, useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref, watch } from 'vue';
import type {
  Duty,
  DutyAssignment,
  Registration,
  Room,
} from '@camp-registration/common/entities';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatPersonName } from '@/utils/formatters';
import { parseLocalDate } from '@/utils/date';

const { t, d } = useI18n();
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const registrationHelper = useRegistrationHelper();
const { to } = useObjectTranslation();

const props = defineProps<{
  duties: Duty[];
  assignments: DutyAssignment[];
  registrations: Registration[];
  rooms: Room[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const dutyOptions = computed<QSelectOption[]>(() => {
  return props.duties.map((duty) => ({ label: to(duty.name), value: duty.id }));
});

// Defaults to the first duty once duties load, but only until the user picks
// one themselves.
const historyDutyId = ref<string | null>(null);
watch(
  () => props.duties,
  (list) => {
    if (historyDutyId.value === null && list.length > 0) {
      historyDutyId.value = list[0]!.id;
    }
  },
  { immediate: true },
);

function currentRoom(registrationId: string): Room | undefined {
  return props.rooms.find((room) =>
    room.beds.some((bed) => bed.registrationId === registrationId),
  );
}

interface Occurrence {
  date: string;
  slot: string | null;
}

interface HistoryRow {
  id: string;
  name: string;
  count: number;
  occurrences: Occurrence[];
}

// Scoped to one duty at a time — mixing counts across unrelated duty types
// (Kitchen and Trash, say) into one total isn't actionable.
const historyAssignments = computed<DutyAssignment[]>(() => {
  return props.assignments.filter(
    (assignment) => assignment.dutyId === historyDutyId.value,
  );
});

function sortedOccurrences(entries: Occurrence[]): Occurrence[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

// Only actual history (count > 0), ranked most-active first — this is a
// record of who has done the duty, not a full roster; "who hasn't yet" is
// already what the suggestion ranking surfaces when planning the next one.
// Each row can be expanded to see exactly which occurrences it came from.
const participantHistoryRows = computed<HistoryRow[]>(() => {
  const occurrences = new Map<string, Occurrence[]>();

  for (const assignment of historyAssignments.value) {
    for (const registrationId of assignment.registrationIds) {
      const list = occurrences.get(registrationId) ?? [];
      list.push({ date: assignment.date, slot: assignment.slot });
      occurrences.set(registrationId, list);
    }
  }

  return props.registrations
    .filter((registration) => occurrences.has(registration.id))
    .map((registration) => {
      const entries = sortedOccurrences(occurrences.get(registration.id)!);
      return {
        id: registration.id,
        name: formatPersonName(registrationHelper.uniqueName(registration)),
        count: entries.length,
        occurrences: entries,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
});

// Mirrors the backend's ROOM suggestion ranking: a historical member's
// *current* room is what counts, so this stays correct as room assignments
// change over the camp. Each room counts at most once per occurrence,
// regardless of how many of its occupants were members that day.
const roomHistoryRows = computed<HistoryRow[]>(() => {
  const occurrences = new Map<string, Occurrence[]>();

  for (const assignment of historyAssignments.value) {
    const roomIds = new Set<string>();
    for (const registrationId of assignment.registrationIds) {
      const room = currentRoom(registrationId);
      if (room) {
        roomIds.add(room.id);
      }
    }
    for (const roomId of roomIds) {
      const list = occurrences.get(roomId) ?? [];
      list.push({ date: assignment.date, slot: assignment.slot });
      occurrences.set(roomId, list);
    }
  }

  return props.rooms
    .filter((room) => occurrences.has(room.id))
    .map((room) => {
      const entries = sortedOccurrences(occurrences.get(room.id)!);
      return {
        id: room.id,
        name: to(room.name),
        count: entries.length,
        occurrences: entries,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
});

function occurrenceLabel(occurrence: Occurrence): string {
  const datePart = d(parseLocalDate(occurrence.date), 'date');
  return occurrence.slot ? `${datePart} — ${occurrence.slot}` : datePart;
}
</script>

<style scoped>
.history-card {
  min-width: min(480px, 90vw);
}

.section-card {
  border-radius: 16px;
}

.occurrence-list {
  padding-left: 16px;
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Assignment history'
dutyLabel: 'Duty'
empty: 'No history yet for this duty.'
count: '{count} time(s)'
participants: 'Participants'
rooms: 'Rooms'

action:
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Einsatzverlauf'
dutyLabel: 'Dienst'
empty: 'Noch keine Historie für diesen Dienst.'
count: '{count} Mal'
participants: 'Teilnehmende'
rooms: 'Zimmer'

action:
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Historique des affectations'
dutyLabel: 'Corvée'
empty: "Pas encore d'historique pour cette corvée."
count: '{count} fois'
participants: 'Participants'
rooms: 'Chambres'

action:
  close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Historia przypisań'
dutyLabel: 'Dyżur'
empty: 'Brak historii dla tego dyżuru.'
count: '{count} razy'
participants: 'Uczestnicy'
rooms: 'Pokoje'

action:
  close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Historie přiřazení'
dutyLabel: 'Služba'
empty: 'Zatím žádná historie pro tuto službu.'
count: '{count}×'
participants: 'Účastníci'
rooms: 'Pokoje'

action:
  close: 'Zavřít'
</i18n>
