<template>
  <!-- Phones: one block per day instead of a seven-column table. -->
  <div
    v-if="agenda"
    class="column no-wrap q-gutter-y-md"
  >
    <div
      v-for="day in days"
      :key="day"
      :class="{ 'day--outside': isOutside(day) }"
    >
      <div
        class="row items-center q-mb-xs"
        :class="{ 'text-primary': day === today }"
      >
        <div class="text-subtitle2 text-weight-medium">
          {{ dayLabel(day) }}
        </div>
        <q-space />
        <q-btn
          v-if="canCreate && dayEntries(day).length > 0"
          icon="add"
          flat
          round
          :aria-label="t('add')"
          @click="
            emit('create', { choreId: undefined, slotId: null, date: day })
          "
        />
      </div>
      <button
        v-if="dayEntries(day).length === 0 && canCreate"
        type="button"
        class="add-day rounded-lg row items-center no-wrap"
        @click="emit('create', { choreId: undefined, slotId: null, date: day })"
      >
        <span class="col text-left">
          {{ isOutside(day) ? t('outside') : t('none') }}
        </span>
        <q-icon
          name="add"
          size="20px"
        />
      </button>
      <div
        v-else-if="dayEntries(day).length === 0"
        class="text-caption text-grey-7"
      >
        {{ isOutside(day) ? t('outside') : t('none') }}
      </div>
      <q-list
        v-else
        bordered
        separator
        class="rounded-lg"
      >
        <q-item
          v-for="{ row, assignment } in dayEntries(day)"
          :key="assignment.id"
          clickable
          @click="emit('open', assignment)"
        >
          <q-item-section>
            <q-item-label class="text-body2 text-weight-medium">
              {{ row.slot ? `${row.chore} — ${row.slot}` : row.chore }}
            </q-item-label>
            <q-item-label
              caption
              :class="{
                'entry-cancelled': assignment.status === 'CANCELLED',
              }"
            >
              {{ memberLine(assignment) }}
            </q-item-label>
          </q-item-section>
          <q-item-section
            v-if="hasOpenSpots(assignment) || assignment.status === 'DONE'"
            side
          >
            <q-icon
              :name="
                assignment.status === 'DONE' ? 'task_alt' : 'warning_amber'
              "
              :color="assignment.status === 'DONE' ? 'positive' : 'warning'"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>

  <div
    v-else
    class="grid-scroll"
  >
    <table
      class="week-grid"
      :class="{ 'week-grid--print': print }"
    >
      <thead>
        <tr>
          <th class="row-head" />
          <th
            v-for="day in days"
            :key="day"
            :class="{ today: day === today, outside: isOutside(day) }"
          >
            {{ dayLabel(day) }}
            <div
              v-if="isOutside(day)"
              class="text-caption"
            >
              {{ t('outside') }}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.key"
        >
          <th class="row-head">
            <div class="text-weight-medium">{{ row.chore }}</div>
            <div
              v-if="row.slot"
              class="text-caption"
            >
              {{ row.slot }}
            </div>
          </th>
          <td
            v-for="day in days"
            :key="day"
            :class="{ today: day === today, outside: isOutside(day) }"
          >
            <div
              v-for="assignment in cell(row, day)"
              :key="assignment.id"
              class="entry rounded-md"
              :class="{
                'entry--open': !print && hasOpenSpots(assignment),
                'entry--done': assignment.status === 'DONE',
                'entry--cancelled': assignment.status === 'CANCELLED',
                'cursor-pointer': !print,
              }"
              @click="!print && emit('open', assignment)"
            >
              <div
                v-for="member in orderedMembers(assignment)"
                :key="member.registrationId"
                :class="{
                  'entry-supervisor': member.role === 'SUPERVISOR',
                  'entry-missed': member.missed,
                }"
              >
                {{ names.get(member.registrationId) ?? '?' }}
              </div>
              <div
                v-if="!print && hasOpenSpots(assignment)"
                class="entry-open"
              >
                <q-icon
                  name="warning_amber"
                  size="14px"
                />
                {{ t('open') }}
              </div>
            </div>
            <button
              v-if="!print && canCreate && cell(row, day).length === 0"
              type="button"
              class="add-cell rounded-md"
              :aria-label="`${t('add')}: ${row.chore}, ${dayLabel(day)}`"
              @click="
                emit('create', {
                  choreId: row.choreId,
                  slotId: row.slotId,
                  date: day,
                })
              "
            >
              <q-icon
                name="add"
                size="18px"
              />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  Chore,
  ChoreAssignment,
} from '@camp-registration/common/entities';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { addDays, formatLocalDate, parseLocalDate } from '@/utils/date';
import { openSpots, sortByName } from '@/utils/chores';

const props = defineProps<{
  chores: Chore[];
  assignments: ChoreAssignment[];
  // First day shown; seven days follow.
  weekStart: string;
  names: Map<string, string>;
  canCreate?: boolean;
  print?: boolean;
  agenda?: boolean;
  // Inclusive `YYYY-MM-DD` event dates; days outside are shown muted.
  eventStart?: string | undefined;
  eventEnd?: string | undefined;
}>();

const emit = defineEmits<{
  open: [assignment: ChoreAssignment];
  create: [
    target: {
      choreId: string | undefined;
      slotId: string | null;
      date: string;
    },
  ];
}>();

const { t, locale } = useI18n();
const { to } = useObjectTranslation();

const today = formatLocalDate(new Date());

const dayFormat = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
    }),
);

function dayLabel(day: string): string {
  return dayFormat.value.format(parseLocalDate(day));
}

const days = computed<string[]>(() =>
  Array.from({ length: 7 }, (_, index) => addDays(props.weekStart, index)),
);

interface GridRow {
  key: string;
  choreId: string;
  slotId: string | null;
  chore: string;
  slot: string | null;
  // Sort keys: slot time (untimed last), then chore and slot order.
  time: string;
  order: [number, number];
}

// One row per slot; a chore without slots (or duties without one) gets a
// plain row.
const rows = computed<GridRow[]>(() =>
  props.chores
    .flatMap((chore) => {
      const slotRows: GridRow[] = chore.slots.map((slot) => ({
        key: `${chore.id}:${slot.id}`,
        choreId: chore.id,
        slotId: slot.id,
        chore: to(chore.name),
        slot: slot.time ? `${to(slot.name)} · ${slot.time}` : to(slot.name),
        time: slot.time ?? '99:99',
        order: [chore.sortOrder, slot.sortOrder],
      }));
      const hasUnslotted =
        chore.slots.length === 0 ||
        props.assignments.some((a) => a.choreId === chore.id && !a.slotId);
      return hasUnslotted
        ? [
            ...slotRows,
            {
              key: chore.id,
              choreId: chore.id,
              slotId: null,
              chore: to(chore.name),
              slot: null,
              time: '99:99',
              order: [chore.sortOrder, Number.MAX_SAFE_INTEGER] as [
                number,
                number,
              ],
            },
          ]
        : slotRows;
    })
    .sort(
      (a, b) =>
        a.time.localeCompare(b.time) ||
        a.order[0] - b.order[0] ||
        a.order[1] - b.order[1],
    ),
);

const byCell = computed(() => {
  const map = new Map<string, ChoreAssignment[]>();
  for (const assignment of props.assignments) {
    const key = `${assignment.choreId}:${assignment.slotId ?? ''}:${assignment.date}`;
    map.set(key, [...(map.get(key) ?? []), assignment]);
  }
  return map;
});

function cell(row: GridRow, day: string): ChoreAssignment[] {
  return byCell.value.get(`${row.choreId}:${row.slotId ?? ''}:${day}`) ?? [];
}

function isOutside(day: string): boolean {
  return (
    (!!props.eventStart && day < props.eventStart) ||
    (!!props.eventEnd && day > props.eventEnd)
  );
}

function dayEntries(day: string) {
  return rows.value.flatMap((row) =>
    cell(row, day).map((assignment) => ({ row, assignment })),
  );
}

function memberLine(assignment: ChoreAssignment): string {
  const people = assignment.members
    .filter((m) => m.role === 'MEMBER')
    .map((m) => props.names.get(m.registrationId) ?? '?')
    .sort((a, b) => a.localeCompare(b));
  const supervisors = assignment.members
    .filter((m) => m.role === 'SUPERVISOR')
    .map((m) => props.names.get(m.registrationId) ?? '?')
    .sort((a, b) => a.localeCompare(b));
  return [
    people.join(', ') || t('nobody'),
    supervisors.length > 0
      ? t('supervisedBy', { names: supervisors.join(', ') })
      : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
}

function orderedMembers(assignment: ChoreAssignment) {
  return [
    ...sortByName(
      assignment.members.filter((m) => m.role === 'MEMBER'),
      props.names,
    ),
    ...sortByName(
      assignment.members.filter((m) => m.role === 'SUPERVISOR'),
      props.names,
    ),
  ];
}

const choreById = computed(() => new Map(props.chores.map((c) => [c.id, c])));

function hasOpenSpots(assignment: ChoreAssignment): boolean {
  const chore = choreById.value.get(assignment.choreId);
  return (
    openSpots(assignment, chore, 'MEMBER') +
      openSpots(assignment, chore, 'SUPERVISOR') >
    0
  );
}
</script>

<style scoped>
.grid-scroll {
  overflow-x: auto;
}

.week-grid {
  width: 100%;
  min-width: 720px;
  border-collapse: separate;
  border-spacing: 4px;
  table-layout: fixed;
}

.week-grid th {
  font-weight: 500;
  font-size: 13px;
  color: var(--md3-on-surface-variant);
  text-align: left;
  padding: 4px;
}

.week-grid .row-head {
  width: 140px;
  vertical-align: top;
  color: var(--md3-on-surface);
}

.week-grid td {
  height: 1px; /* lets `.add-cell` fill the cell via height: 100% */
  vertical-align: top;
  padding: 4px;
  border-radius: 12px;
  background: var(--md3-surface-container-low);
  min-height: 48px;
}

.week-grid th.today,
.week-grid td.today {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.entry {
  position: relative;
  font-size: 12px;
  line-height: 1.35;
  padding: 4px 6px;
  margin-bottom: 4px;
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface);
}

.day--outside {
  opacity: 0.55;
}

.week-grid th.outside,
.week-grid td.outside {
  background: repeating-linear-gradient(
    -45deg,
    var(--md3-surface-container-lowest),
    var(--md3-surface-container-lowest) 6px,
    var(--md3-surface-container-low) 6px,
    var(--md3-surface-container-low) 12px
  );
  color: var(--md3-on-surface-variant);
}

.entry-cancelled {
  text-decoration: line-through;
}

.entry--cancelled {
  opacity: 0.5;
  text-decoration: line-through;
}

.entry-supervisor {
  font-style: italic;
  color: var(--md3-on-surface-variant);
}

.entry-missed {
  text-decoration: line-through;
  opacity: 0.6;
}

.entry-open {
  color: var(--md3-on-warning-container);
}

/* Status as a bar on the left edge, clipped to the tile's corners. */
.entry {
  overflow: hidden;
  box-shadow: inset 3px 0 0 var(--md3-primary);
}

.entry--open {
  box-shadow: inset 3px 0 0 var(--md3-warning);
}

.entry--done {
  box-shadow: inset 3px 0 0 var(--md3-positive);
}

.entry--cancelled {
  box-shadow: inset 3px 0 0 var(--md3-outline);
}

.add-cell,
.add-day {
  width: 100%;
  border: 1px dashed transparent;
  background: none;
  color: var(--md3-on-surface-variant);
  cursor: pointer;
  font: inherit;
}

.add-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  height: 100%;
}

.add-cell .q-icon {
  opacity: 0.35;
}

.add-day {
  min-height: 48px;
  padding: 0 12px;
  border-color: var(--md3-outline-variant);
  font-size: 12px;
}

.add-cell:hover,
.add-cell:focus-visible,
.add-day:hover,
.add-day:focus-visible {
  border-color: var(--md3-primary);
  background: rgba(var(--md3-primary-rgb), 0.08);
  color: var(--md3-primary);
  outline: none;
}

.add-cell:hover .q-icon,
.add-cell:focus-visible .q-icon {
  opacity: 1;
}

/* Paper: no fills, clear lines, everything readable in black and white. */
.week-grid--print {
  min-width: 0;
  border-collapse: collapse;
}

.week-grid--print th,
.week-grid--print td,
.week-grid--print th.today,
.week-grid--print td.today,
.week-grid--print th.outside,
.week-grid--print td.outside {
  border: 1px solid var(--md3-outline);
  border-radius: 0;
  background: none;
  color: var(--md3-on-surface);
}

.week-grid--print .entry {
  background: none;
  box-shadow: none;
  padding: 0;
  font-size: 11px;
}
</style>

<i18n lang="yaml" locale="en">
outside: 'Outside the event'
none: 'No duties'
nobody: 'No one yet'
supervisedBy: 'supervised by {names}'
open: 'Open spots'
add: 'Add duty'
</i18n>

<i18n lang="yaml" locale="de">
outside: 'Außerhalb der Veranstaltung'
none: 'Keine Dienste'
nobody: 'Noch niemand'
supervisedBy: 'Aufsicht: {names}'
open: 'Offene Plätze'
add: 'Dienst hinzufügen'
</i18n>

<i18n lang="yaml" locale="fr">
outside: 'Hors de l’événement'
none: 'Aucune corvée'
nobody: 'Personne pour l’instant'
supervisedBy: 'encadré par {names}'
open: 'Places libres'
add: 'Ajouter une corvée'
</i18n>

<i18n lang="yaml" locale="pl">
outside: 'Poza wydarzeniem'
none: 'Brak dyżurów'
nobody: 'Jeszcze nikt'
supervisedBy: 'opieka: {names}'
open: 'Wolne miejsca'
add: 'Dodaj dyżur'
</i18n>

<i18n lang="yaml" locale="cs">
outside: 'Mimo akci'
none: 'Žádné služby'
nobody: 'Zatím nikdo'
supervisedBy: 'dozor: {names}'
open: 'Volná místa'
add: 'Přidat službu'
</i18n>
