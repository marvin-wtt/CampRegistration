<template>
  <!-- One stacked block, so names get the full width on phones. -->
  <q-item
    class="assignment"
    :class="{
      'assignment--open': openMembers + openSupervisors > 0,
      'assignment--done': assignment.status === 'DONE',
      'assignment--cancelled': assignment.status === 'CANCELLED',
    }"
  >
    <q-item-section>
      <div class="row items-center no-wrap">
        <q-icon
          :name="statusIcon"
          :color="statusColor"
          size="20px"
          class="q-mr-sm"
        />
        <div class="col">
          <div class="title-row row items-center">
            <span
              v-if="canEdit"
              class="title text-weight-medium cursor-pointer"
              role="button"
              tabindex="0"
              @click="emit('edit')"
              @keydown.enter="emit('edit')"
            >
              {{ title }}
            </span>
            <span
              v-else
              class="text-weight-medium"
            >
              {{ title }}
            </span>
            <q-badge
              v-if="assignment.status !== 'PLANNED'"
              :color="assignment.status === 'DONE' ? 'positive' : 'grey-7'"
              rounded
            >
              {{ t(`status.${assignment.status}`) }}
            </q-badge>
          </div>
          <div
            v-if="slot?.time"
            class="text-caption text-grey-7"
          >
            {{ slot.time }}
          </div>
        </div>
        <div
          v-if="canEdit || canDelete"
          class="row no-wrap items-center"
        >
          <q-btn
            v-if="canEdit && assignment.status === 'PLANNED' && !isFuture"
            icon="check"
            flat
            round
            color="positive"
            :aria-label="t('action.done')"
            @click="emit('setStatus', 'DONE')"
          >
            <q-tooltip>{{ t('action.done') }}</q-tooltip>
          </q-btn>
          <q-btn
            icon="more_vert"
            flat
            round
            :aria-label="t('action.more')"
          >
            <q-menu>
              <q-list>
                <q-item
                  v-if="canEdit"
                  v-close-popup
                  clickable
                  @click="emit('edit')"
                >
                  <q-item-section avatar>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>{{ t('action.edit') }}</q-item-section>
                </q-item>
                <q-item
                  v-if="canEdit"
                  v-close-popup
                  clickable
                  @click="emit('addPerson')"
                >
                  <q-item-section avatar>
                    <q-icon name="person_add" />
                  </q-item-section>
                  <q-item-section>{{ t('action.addPerson') }}</q-item-section>
                </q-item>
                <q-item
                  v-if="canEdit && assignment.status !== 'DONE'"
                  v-close-popup
                  clickable
                  @click="emit('setStatus', 'DONE')"
                >
                  <q-item-section avatar>
                    <q-icon name="task_alt" />
                  </q-item-section>
                  <q-item-section>{{ t('action.done') }}</q-item-section>
                </q-item>
                <q-item
                  v-if="canEdit && assignment.status !== 'CANCELLED'"
                  v-close-popup
                  clickable
                  @click="emit('setStatus', 'CANCELLED')"
                >
                  <q-item-section avatar>
                    <q-icon name="event_busy" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ t('action.cancel') }}</q-item-label>
                    <q-item-label caption>
                      {{ t('action.cancelHint') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="canEdit && assignment.status !== 'PLANNED'"
                  v-close-popup
                  clickable
                  @click="emit('setStatus', 'PLANNED')"
                >
                  <q-item-section avatar>
                    <q-icon name="undo" />
                  </q-item-section>
                  <q-item-section>{{ t('action.reopen') }}</q-item-section>
                </q-item>
                <q-separator v-if="canDelete" />
                <q-item
                  v-if="canDelete"
                  v-close-popup
                  clickable
                  @click="emit('delete')"
                >
                  <q-item-section avatar>
                    <q-icon
                      name="delete"
                      color="negative"
                    />
                  </q-item-section>
                  <q-item-section>{{ t('action.delete') }}</q-item-section>
                </q-item>
                <q-item
                  v-if="canDelete && assignment.batchId"
                  v-close-popup
                  clickable
                  @click="emit('deleteSeries')"
                >
                  <q-item-section avatar>
                    <q-icon
                      name="delete_sweep"
                      color="negative"
                    />
                  </q-item-section>
                  <q-item-section>{{
                    t('action.deleteSeries')
                  }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <div class="member-row row items-center q-mt-sm">
        <span
          v-if="roomName"
          class="text-caption text-grey-7"
        >
          {{ roomName }}:
        </span>
        <q-chip
          v-for="member in people"
          :key="member.registrationId"
          :clickable="canEdit"
          class="member-chip"
          :class="{ 'member-chip--missed': member.missed }"
        >
          {{ name(member.registrationId) }}
          <q-tooltip v-if="member.missed">{{ t('missed') }}</q-tooltip>
          <q-menu v-if="canEdit">
            <q-list>
              <q-item
                v-close-popup
                clickable
                @click="emit('toggleMissed', member.registrationId)"
              >
                <q-item-section avatar>
                  <q-icon :name="member.missed ? 'undo' : 'person_off'" />
                </q-item-section>
                <q-item-section>
                  {{
                    member.missed ? t('action.notMissed') : t('action.missed')
                  }}
                </q-item-section>
              </q-item>
              <q-item
                v-close-popup
                clickable
                @click="emit('replace', member.registrationId)"
              >
                <q-item-section avatar>
                  <q-icon name="swap_horiz" />
                </q-item-section>
                <q-item-section>{{ t('action.replace') }}</q-item-section>
              </q-item>
              <q-item
                v-close-popup
                clickable
                @click="emit('replaceWith', member.registrationId)"
              >
                <q-item-section avatar>
                  <q-icon name="person_search" />
                </q-item-section>
                <q-item-section>{{ t('action.replaceWith') }}</q-item-section>
              </q-item>
              <q-item
                v-close-popup
                clickable
                @click="emit('removeMember', member.registrationId)"
              >
                <q-item-section avatar>
                  <q-icon name="person_remove" />
                </q-item-section>
                <q-item-section>{{ t('action.remove') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-chip>
        <span
          v-if="people.length === 0 && openMembers === 0"
          class="text-caption text-grey-7"
        >
          {{ t('nobody') }}
        </span>
      </div>

      <div
        v-if="supervisors.length > 0"
        class="text-caption text-grey-7 q-mt-xs"
      >
        {{
          t('supervisedBy', {
            names: supervisors
              .map((m) => name(m.registrationId) + (m.missed ? ' ✗' : ''))
              .join(', '),
          })
        }}
      </div>

      <div
        v-if="assignment.note"
        class="note row no-wrap items-start q-mt-sm"
      >
        <q-icon
          name="sticky_note_2"
          size="16px"
          class="q-mr-xs"
        />
        <span class="note-text">{{ assignment.note }}</span>
      </div>

      <div
        v-if="openMembers + openSupervisors > 0"
        class="open-row row items-center q-mt-sm"
      >
        <span class="text-caption text-weight-medium open-text">
          <q-icon
            name="warning_amber"
            size="16px"
          />
          {{ openText }}
        </span>
        <q-btn
          v-if="canEdit"
          icon="auto_awesome"
          :label="t('action.fill')"
          color="primary"
          outline
          rounded
          no-caps
          @click="emit('fill')"
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  Chore,
  ChoreAssignment,
  ChoreAssignmentStatus,
  Room,
} from '@camp-registration/common/entities';
import { useObjectTranslation } from '@/composables/objectTranslation';
import {
  findSlot,
  membersWithRole,
  openSpots,
  sortByName,
} from '@/utils/chores';
import { formatLocalDate } from '@/utils/date';

const props = defineProps<{
  assignment: ChoreAssignment;
  chore: Chore | undefined;
  rooms: Room[];
  names: Map<string, string>;
  canEdit: boolean;
  canDelete: boolean;
}>();

const emit = defineEmits<{
  edit: [];
  delete: [];
  deleteSeries: [];
  fill: [];
  setStatus: [status: ChoreAssignmentStatus];
  toggleMissed: [registrationId: string];
  replace: [registrationId: string];
  replaceWith: [registrationId: string];
  addPerson: [];
  removeMember: [registrationId: string];
}>();

const { t } = useI18n();
const { to } = useObjectTranslation();

const slot = computed(() => findSlot(props.chore, props.assignment.slotId));

const title = computed<string>(() => {
  const choreName = props.chore ? to(props.chore.name) : '';
  return slot.value ? `${choreName} — ${to(slot.value.name)}` : choreName;
});

const people = computed(() =>
  sortByName(membersWithRole(props.assignment.members, 'MEMBER'), props.names),
);
const supervisors = computed(() =>
  sortByName(
    membersWithRole(props.assignment.members, 'SUPERVISOR'),
    props.names,
  ),
);

const openMembers = computed(() =>
  openSpots(props.assignment, props.chore, 'MEMBER'),
);
const openSupervisors = computed(() =>
  openSpots(props.assignment, props.chore, 'SUPERVISOR'),
);

const openText = computed<string>(() =>
  [
    openMembers.value > 0 ? t('open.people', openMembers.value) : undefined,
    openSupervisors.value > 0
      ? t('open.supervisors', openSupervisors.value)
      : undefined,
  ]
    .filter(Boolean)
    .join(' · '),
);

const isFuture = computed<boolean>(
  () => props.assignment.date > formatLocalDate(new Date()),
);

const statusIcon = computed<string>(() => {
  switch (props.assignment.status) {
    case 'DONE':
      return 'task_alt';
    case 'CANCELLED':
      return 'event_busy';
    default:
      return props.assignment.rotationUnit === 'ROOM'
        ? 'meeting_room'
        : 'radio_button_unchecked';
  }
});

const statusColor = computed<string>(() =>
  props.assignment.status === 'DONE' ? 'positive' : 'grey-6',
);

function name(registrationId: string): string {
  return props.names.get(registrationId) ?? t('unknown');
}

// "Room 101: Anna, Ben" when everyone doing it shares a room.
const roomName = computed<string | undefined>(() => {
  const ids = people.value.map((m) => m.registrationId);
  const roomOf = (id: string) =>
    props.rooms.find((room) => room.beds.some((b) => b.registrationId === id));
  const first = ids[0] ? roomOf(ids[0]) : undefined;
  return first &&
    ids.length > 1 &&
    ids.every((id) => roomOf(id)?.id === first.id)
    ? to(first.name)
    : undefined;
});
</script>

<style scoped>
.title-row,
.member-row,
.open-row {
  gap: 6px;
}

/* Status as a bar on the left edge. The list clips it along its rounded
   corners, so it follows the card's shape. */
.assignment {
  box-shadow: inset 4px 0 0 var(--md3-primary);
}

.assignment--open {
  box-shadow: inset 4px 0 0 var(--md3-warning);
}

.assignment--done {
  box-shadow: inset 4px 0 0 var(--md3-positive);
}

.assignment--cancelled {
  box-shadow: inset 4px 0 0 var(--md3-outline);
}

.title:hover,
.title:focus-visible {
  text-decoration: underline;
  outline: none;
}

.note {
  color: var(--md3-on-surface-variant);
  font-size: 13px;
}

.note-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-line;
}

.assignment--cancelled {
  opacity: 0.6;
}

.open-text {
  color: var(--md3-on-warning-container);
}

.member-chip {
  margin: 0;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface);
}

.member-chip--missed {
  text-decoration: line-through;
  opacity: 0.6;
}
</style>

<i18n lang="yaml" locale="en">
unknown: 'Unknown person'
nobody: 'No one assigned'
missed: 'Missed'
supervisedBy: 'Supervised by {names}'
open:
  people: 'No open spots | 1 spot open | {n} spots open'
  supervisors: 'No supervisor missing | 1 supervisor missing | {n} supervisors missing'
status:
  PLANNED: 'Planned'
  DONE: 'Done'
  CANCELLED: 'Cancelled'
action:
  replaceWith: 'Replace with …'
  addPerson: 'Add person …'
  more: 'More'
  edit: 'Edit'
  done: 'Mark as done'
  cancel: 'Cancel duty'
  cancelHint: 'It didn’t take place — stays in the history, counts for no one'
  reopen: 'Back to planned'
  fill: 'Fill fairly'
  delete: 'Delete'
  deleteSeries: 'Delete whole series'
  missed: 'Mark as missed'
  notMissed: 'Not missed after all'
  replace: 'Replace with next in line'
  remove: 'Remove from this duty'
</i18n>

<i18n lang="yaml" locale="de">
unknown: 'Unbekannte Person'
nobody: 'Niemand eingeteilt'
missed: 'Verpasst'
supervisedBy: 'Aufsicht: {names}'
open:
  people: 'Keine offenen Plätze | 1 Platz offen | {n} Plätze offen'
  supervisors: 'Keine Aufsicht fehlt | 1 Aufsicht fehlt | {n} Aufsichten fehlen'
status:
  PLANNED: 'Geplant'
  DONE: 'Erledigt'
  CANCELLED: 'Abgesagt'
action:
  replaceWith: 'Ersetzen durch …'
  addPerson: 'Person hinzufügen …'
  more: 'Mehr'
  edit: 'Bearbeiten'
  done: 'Als erledigt markieren'
  cancel: 'Dienst absagen'
  cancelHint: 'Hat nicht stattgefunden — bleibt im Verlauf, zählt für niemanden'
  reopen: 'Zurück auf geplant'
  fill: 'Fair besetzen'
  delete: 'Löschen'
  deleteSeries: 'Ganze Serie löschen'
  missed: 'Als verpasst markieren'
  notMissed: 'Doch nicht verpasst'
  replace: 'Durch Nächste*n ersetzen'
  remove: 'Aus diesem Dienst entfernen'
</i18n>

<i18n lang="yaml" locale="fr">
unknown: 'Personne inconnue'
nobody: 'Personne n’est attribué'
missed: 'Manquée'
supervisedBy: 'Encadré par {names}'
open:
  people: 'Aucune place libre | 1 place libre | {n} places libres'
  supervisors: 'Aucun encadrant manquant | 1 encadrant manquant | {n} encadrants manquants'
status:
  PLANNED: 'Prévue'
  DONE: 'Faite'
  CANCELLED: 'Annulée'
action:
  replaceWith: 'Remplacer par …'
  addPerson: 'Ajouter une personne …'
  more: 'Plus'
  edit: 'Modifier'
  done: 'Marquer comme faite'
  cancel: 'Annuler la corvée'
  cancelHint: 'Elle n’a pas eu lieu — reste dans l’historique, ne compte pour personne'
  reopen: 'Revenir à prévue'
  fill: 'Remplir équitablement'
  delete: 'Supprimer'
  deleteSeries: 'Supprimer toute la série'
  missed: 'Marquer comme manquée'
  notMissed: 'Finalement pas manquée'
  replace: 'Remplacer par le suivant'
  remove: 'Retirer de cette corvée'
</i18n>

<i18n lang="yaml" locale="pl">
unknown: 'Nieznana osoba'
nobody: 'Nikt nie przydzielony'
missed: 'Pominięty'
supervisedBy: 'Opieka: {names}'
open:
  people: 'Brak wolnych miejsc | 1 wolne miejsce | {n} wolnych miejsc'
  supervisors: 'Nie brakuje opiekuna | Brakuje 1 opiekuna | Brakuje {n} opiekunów'
status:
  PLANNED: 'Zaplanowany'
  DONE: 'Wykonany'
  CANCELLED: 'Odwołany'
action:
  replaceWith: 'Zastąp przez …'
  addPerson: 'Dodaj osobę …'
  more: 'Więcej'
  edit: 'Edytuj'
  done: 'Oznacz jako wykonany'
  cancel: 'Odwołaj dyżur'
  cancelHint: 'Nie odbył się — zostaje w historii, nikomu się nie liczy'
  reopen: 'Z powrotem na zaplanowany'
  fill: 'Obsadź sprawiedliwie'
  delete: 'Usuń'
  deleteSeries: 'Usuń całą serię'
  missed: 'Oznacz jako pominięty'
  notMissed: 'Jednak nie pominięty'
  replace: 'Zastąp następną osobą'
  remove: 'Usuń z tego dyżuru'
</i18n>

<i18n lang="yaml" locale="cs">
unknown: 'Neznámá osoba'
nobody: 'Nikdo nepřiřazen'
missed: 'Zmeškáno'
supervisedBy: 'Dozor: {names}'
open:
  people: 'Žádná volná místa | 1 volné místo | {n} volných míst'
  supervisors: 'Žádný dozor nechybí | Chybí 1 dozor | Chybí {n} dozorů'
status:
  PLANNED: 'Naplánováno'
  DONE: 'Hotovo'
  CANCELLED: 'Zrušeno'
action:
  replaceWith: 'Nahradit za …'
  addPerson: 'Přidat osobu …'
  more: 'Více'
  edit: 'Upravit'
  done: 'Označit jako hotové'
  cancel: 'Zrušit službu'
  cancelHint: 'Neproběhla — zůstane v historii, nikomu se nepočítá'
  reopen: 'Zpět na naplánováno'
  fill: 'Obsadit spravedlivě'
  delete: 'Smazat'
  deleteSeries: 'Smazat celou sérii'
  missed: 'Označit jako zmeškané'
  notMissed: 'Nakonec nezmeškáno'
  replace: 'Nahradit dalším v pořadí'
  remove: 'Odebrat z této služby'
</i18n>
