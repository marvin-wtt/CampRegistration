<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onHide"
  >
    <q-card
      class="task-details"
      :class="{ 'task-details--sheet': sheet }"
      :flat="sheet"
    >
      <!-- Title row: the round toggle is the task's status. -->
      <div class="details-header row items-start no-wrap">
        <task-status-toggle
          :completed="task.completed"
          :disable="!canUpdate"
          data-test="task-details-toggle"
          @toggle="toggleCompleted"
        />

        <!-- Reads as text until clicked, like the details below. -->
        <q-input
          v-if="canUpdate"
          ref="titleInput"
          v-model="title"
          :readonly="!titleEditing"
          :aria-label="t('field.title')"
          :input-class="[
            'details-title',
            { 'details-title--done': task.completed },
          ]"
          class="title-field col"
          :class="{ 'title-field--editing': titleEditing }"
          data-test="task-details-title"
          borderless
          dense
          autogrow
          @click="startTitleEdit"
          @blur="commitTitle"
          @keydown.enter.prevent="onTitleEnter"
          @keydown.esc="onTitleEscape"
        >
          <template
            v-if="!titleEditing"
            #append
          >
            <q-icon
              name="edit"
              size="16px"
              class="title-field__hint"
            />
          </template>
        </q-input>
        <div
          v-else
          class="details-title details-title--static col"
          :class="{ 'details-title--done': task.completed }"
        >
          {{ task.title }}
        </div>
      </div>

      <!-- Meta -->
      <q-list class="details-meta">
        <q-item
          :clickable="canUpdate"
          class="meta-row rounded-md"
          data-test="task-details-due-date"
        >
          <q-item-section avatar>
            <div
              class="meta-icon"
              :class="`meta-icon--${phase}`"
            >
              <q-icon
                name="event"
                size="18px"
              />
            </div>
          </q-item-section>
          <q-item-section>
            <div class="meta-label">{{ t('field.dueDate') }}</div>
            <div
              class="meta-value"
              :class="dueTextClass"
            >
              {{
                task.dueDate
                  ? d(parseLocalDate(task.dueDate), 'dateFull')
                  : t('noDueDate')
              }}
            </div>
          </q-item-section>
          <q-item-section
            v-if="canUpdate && task.dueDate"
            side
          >
            <q-btn
              :aria-label="t('action.clearDueDate')"
              icon="close"
              color="on-surface-variant"
              flat
              round
              dense
              @click.stop="setDueDate(null)"
            />
          </q-item-section>
          <q-item-section
            v-if="canUpdate"
            side
          >
            <q-icon
              name="expand_more"
              color="on-surface-variant"
            />
          </q-item-section>
          <q-popup-proxy
            v-if="canUpdate"
            ref="dueDatePopup"
            transition-show="scale"
            transition-hide="scale"
          >
            <q-date
              :model-value="task.dueDate"
              mask="YYYY-MM-DD"
              minimal
              @update:model-value="onDatePicked"
            />
          </q-popup-proxy>
        </q-item>

        <q-item
          :clickable="canUpdate"
          class="meta-row rounded-md"
          data-test="task-details-assignee"
        >
          <q-item-section avatar>
            <div class="meta-icon">
              <q-icon
                name="person"
                size="18px"
              />
            </div>
          </q-item-section>
          <q-item-section>
            <div class="meta-label">{{ t('field.assignee') }}</div>
            <div class="meta-value row items-center q-gutter-x-xs">
              <span>{{ assigneeName }}</span>
              <q-badge
                v-if="mine"
                class="mine-badge"
                color="primary"
                :label="t('you')"
              />
            </div>
          </q-item-section>
          <q-item-section
            v-if="canUpdate && task.assigneeId"
            side
          >
            <q-btn
              :aria-label="t('action.clearAssignee')"
              icon="close"
              color="on-surface-variant"
              data-test="task-details-clear-assignee"
              flat
              round
              dense
              @click.stop="setAssignee(null)"
            />
          </q-item-section>
          <q-item-section
            v-if="canUpdate"
            side
          >
            <q-icon
              name="expand_more"
              color="on-surface-variant"
            />
          </q-item-section>
          <q-menu
            v-if="canUpdate"
            fit
          >
            <q-list>
              <q-item
                v-for="option in assigneeOptions"
                :key="option.value"
                clickable
                v-close-popup
                @click="setAssignee(option.value)"
              >
                <q-item-section>{{ option.label }}</q-item-section>
                <q-item-section
                  v-if="option.value === task.assigneeId"
                  side
                >
                  <q-icon
                    name="check"
                    color="primary"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-item>
      </q-list>

      <!-- Notes -->
      <div class="details-notes">
        <div class="row items-center q-mb-xs">
          <div class="meta-label col">{{ t('field.notes') }}</div>
          <div
            v-if="progress"
            class="meta-label"
          >
            {{ t('checklist', progress) }}
          </div>
        </div>

        <task-notes-view
          v-if="canUpdate"
          :model-value="notes"
          editable
          @update:model-value="onNotesInput"
          @focus="notesFocused = true"
          @blur="onNotesBlur"
        />
        <task-notes-view
          v-else-if="task.notes"
          :model-value="task.notes"
        />
        <div
          v-else
          class="text-body2 text-grey-6"
        >
          {{ t('noNotes') }}
        </div>

        <div
          v-if="notesFailed"
          class="notes-error row items-center no-wrap q-mt-xs"
          data-test="task-details-notes-error"
        >
          <q-icon
            name="error_outline"
            size="18px"
          />
          <span class="col">{{ t('notSaved') }}</span>
          <q-btn
            :label="t('action.retry')"
            color="error"
            size="sm"
            flat
            rounded
            no-caps
            @click="retryNotes"
          />
        </div>

        <q-slide-transition>
          <div
            v-if="showCompleteHint"
            class="complete-hint row items-center no-wrap q-mt-sm"
            data-test="task-details-complete-hint"
          >
            <q-icon
              name="checklist"
              size="18px"
            />
            <span class="col">{{ t('allChecked') }}</span>
            <q-btn
              :label="t('action.complete')"
              color="primary"
              size="sm"
              flat
              rounded
              no-caps
              @click="toggleCompleted"
            />
          </div>
        </q-slide-transition>
      </div>

      <!-- Changes save as they happen, so closing is always safe. -->
      <q-card-actions class="details-actions">
        <q-btn
          v-if="canDelete"
          :label="t('action.delete')"
          color="negative"
          data-test="task-details-delete"
          flat
          rounded
          @click="onDelete"
        />
        <q-space />
        <q-btn
          :label="t('action.close')"
          color="primary"
          data-test="task-details-close"
          unelevated
          rounded
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import {
  type QInput,
  type QPopupProxy,
  useDialogPluginComponent,
  useQuasar,
} from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref, useTemplateRef, watch } from 'vue';
import type {
  EventManager,
  Task,
  TaskUpdateData,
} from '@camp-registration/common/entities';
import { taskPhaseOf } from '@/utils/taskPhase';
import { parseLocalDate } from '@/utils/date';
import { checklistProgress } from '@/utils/taskNotes';
import { useTaskStore } from '@/stores/task-store';
import { useCurrentManager } from '@/composables/currentManager';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import TaskNotesView from '@/components/event/tasks/TaskNotesView.vue';
import TaskStatusToggle from '@/components/event/tasks/TaskStatusToggle.vue';

const quasar = useQuasar();
const { t, d } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const props = defineProps<{
  task: Task;
  managers: EventManager[];
  canUpdate: boolean;
  canDelete: boolean;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const taskStore = useTaskStore();
const { currentManagerId } = useCurrentManager();

// Mirrors ResponsiveDialog's switch to a bottom sheet.
const sheet = computed<boolean>(() => quasar.screen.lt.sm);

// The prop is a snapshot; the store copy reflects saves made here and
// changes pushed from other clients.
const task = computed<Task>(
  () => taskStore.data?.find(({ id }) => id === props.task.id) ?? props.task,
);

const phase = computed(() => taskPhaseOf(task.value));
const dueTextClass = computed<string>(() => `due-text--${phase.value}`);

const mine = computed<boolean>(
  () =>
    currentManagerId.value !== undefined &&
    task.value.assigneeId === currentManagerId.value,
);

const assigneeName = computed<string>(() => {
  const assignee = task.value.assignee;
  return assignee ? (assignee.name ?? assignee.email) : t('unassigned');
});

// Unassigning is the row's clear button, not a list entry.
const assigneeOptions = computed<{ label: string; value: string }[]>(() =>
  props.managers
    .filter((manager) => manager.status.toUpperCase() !== 'PENDING')
    .map((manager) => ({
      label: manager.name ?? manager.email,
      value: manager.id,
    })),
);

// The store notifies failures and keeps its copy unchanged; callers use the
// result to roll back what the dialog shows locally.
function save(data: TaskUpdateData): Promise<boolean> {
  return taskStore.updateData(task.value.id, data);
}

// Title — read-only until clicked; saved on Enter or blur, Escape cancels, an
// emptied title reverts.
const titleInput = useTemplateRef<QInput>('titleInput');
const title = ref<string>(props.task.title);
const titleEditing = ref<boolean>(false);

watch(
  () => task.value.title,
  (value) => {
    if (!titleEditing.value) {
      title.value = value;
    }
  },
);

function startTitleEdit() {
  if (titleEditing.value) {
    return;
  }

  // Lift readonly on the element itself, inside the tap: iOS only opens the
  // keyboard for a focus that happens within the user's gesture.
  const input = titleInput.value?.getNativeElement() as
    HTMLTextAreaElement | undefined;
  if (input) {
    input.readOnly = false;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
  titleEditing.value = true;
}

function onTitleEnter(event: KeyboardEvent) {
  if (titleEditing.value) {
    (event.target as HTMLElement).blur();
  } else {
    startTitleEdit();
  }
}

// While editing, Escape cancels the edit instead of closing the dialog.
function onTitleEscape(event: KeyboardEvent) {
  if (!titleEditing.value) {
    return;
  }
  event.stopPropagation();
  title.value = task.value.title;
  (event.target as HTMLElement).blur();
}

function commitTitle() {
  if (!titleEditing.value) {
    return;
  }
  titleEditing.value = false;

  const value = title.value.trim();
  if (!value) {
    title.value = task.value.title;
    return;
  }
  if (value !== task.value.title) {
    void save({ title: value }).then((saved) => {
      if (!saved && !titleEditing.value) {
        title.value = task.value.title;
      }
    });
  }
}

// Due date and assignee — saved as soon as they are picked.
const dueDatePopup = useTemplateRef<QPopupProxy>('dueDatePopup');

function setDueDate(value: string | null) {
  if (value !== task.value.dueDate) {
    void save({ dueDate: value });
  }
}

function onDatePicked(value: string | null) {
  setDueDate(value);
  dueDatePopup.value?.hide();
}

function setAssignee(value: string | null) {
  if (value !== task.value.assigneeId) {
    void save({ assigneeId: value });
  }
}

// Notes — typing saves on blur (one save, not one per keystroke); a checkbox
// ticked without focusing the editor saves right away. A failed tick reverts;
// failed typing is kept and offered for retry, as it can't be redone cheaply.
const notes = ref<string>(props.task.notes ?? '');
const notesFocused = ref<boolean>(false);
const notesFailed = ref<boolean>(false);
let notesDirty = false;

const progress = computed(() =>
  checklistProgress(props.canUpdate ? notes.value : task.value.notes),
);

watch(
  () => task.value.notes,
  (value) => {
    if (!notesFocused.value && !notesDirty && !notesFailed.value) {
      notes.value = value ?? '';
    }
  },
);

function onNotesInput(value: string | null | undefined) {
  const before = checklistProgress(notes.value);
  notes.value = value ?? '';
  notesDirty = true;
  updateCompleteHint(before);

  if (!notesFocused.value) {
    commitNotes(true);
  }
}

function onNotesBlur() {
  notesFocused.value = false;
  commitNotes(false);
}

function commitNotes(revertOnFailure: boolean) {
  if (!notesDirty) {
    return;
  }
  notesDirty = false;

  const value = notes.value.trim() || null;
  if (value === task.value.notes) {
    notesFailed.value = false;
    return;
  }

  void save({ notes: value }).then((saved) => {
    if (saved) {
      notesFailed.value = false;
    } else if (revertOnFailure && !notesFailed.value) {
      notes.value = task.value.notes ?? '';
    } else {
      notesFailed.value = true;
    }
  });
}

function retryNotes() {
  notesDirty = true;
  commitNotes(false);
}

// Suggest completing the task when this user ticks its last open item —
// never automatically: a checklist is often only part of the task.
const suggestComplete = ref<boolean>(false);

const showCompleteHint = computed<boolean>(
  () => suggestComplete.value && !task.value.completed,
);

function updateCompleteHint(before: { done: number; total: number } | null) {
  const after = progress.value;
  const allDone = after !== null && after.done === after.total;
  const wasAllDone = before !== null && before.done === before.total;

  if (!allDone) {
    suggestComplete.value = false;
  } else if (!wasAllDone) {
    suggestComplete.value = true;
  }
}

function toggleCompleted() {
  void save({ completed: !task.value.completed });
}

function onDelete() {
  onDialogOK({ action: 'delete' });
}

// Closing (Escape, backdrop, swipe) doesn't always blur first, so pending
// edits are committed here too.
function onHide() {
  commitTitle();
  commitNotes(false);
  onDialogHide();
}
</script>

<style scoped>
.task-details {
  width: 480px;
  max-width: 100%;
  border-radius: 20px;
}

/* The sheet draws the surface and the drag handle sits above the header. */
.task-details--sheet {
  width: 100%;
  border-radius: 0;
  background: transparent;
}

.task-details--sheet .details-header {
  padding-top: 0;
}

.task-details--sheet .notes-error,
.complete-hint {
  gap: 8px;
  padding: 2px 4px 2px 12px;
  border-radius: 12px;
  font-size: 13px;
}

.notes-error {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.complete-hint {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.details-actions {
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

/* Title row */
.details-header {
  gap: 4px;
  padding: 16px 12px 4px 12px;
}

.details-title,
:deep(.details-title) {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  word-break: break-word;
}

/* Centre the title's first 26px line on the 40px status toggle. The field's
   control sits 2px lower, hence 5px for the editable title. */
.details-title--static {
  padding-top: 7px;
}

.details-header :deep(textarea.details-title) {
  padding-top: 5px;
  padding-bottom: 5px;
}

/* Same affordances as the details box: hover layer and pencil at rest, a
   primary outline while editing. */
.title-field :deep(.q-field__control) {
  padding: 0 8px;
  border-radius: 12px;
  transition:
    background-color 150ms ease,
    box-shadow 150ms ease;
}

.title-field:not(.title-field--editing) :deep(textarea) {
  cursor: pointer;
}

.title-field:not(.title-field--editing):hover :deep(.q-field__control) {
  background: color-mix(in srgb, var(--md3-on-surface) 8%, transparent);
}

.title-field:not(.title-field--editing).q-field--focused
  :deep(.q-field__control) {
  box-shadow: inset 0 0 0 2px var(--md3-outline);
}

.title-field--editing :deep(.q-field__control) {
  box-shadow: inset 0 0 0 2px var(--md3-primary);
}

.title-field :deep(.q-field__append) {
  align-self: flex-start;
  height: 40px;
}

.title-field__hint {
  color: var(--md3-on-surface-variant);
  opacity: 0;
  transition: opacity 150ms ease;
}

.title-field:hover .title-field__hint,
.title-field.q-field--focused .title-field__hint {
  opacity: 1;
}

@media (hover: none) {
  .title-field__hint {
    opacity: 0.6;
  }
}

.details-title--done,
:deep(.details-title--done) {
  color: var(--md3-on-surface-variant);
  text-decoration: line-through;
}

/* Meta */
.details-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 12px 8px;
}

.meta-row {
  padding: 6px 12px;
}

.meta-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  border-radius: 10px;
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}

.meta-icon--overdue {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.meta-icon--dueSoon {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);
}

.meta-label {
  font-size: 12px;
  color: var(--md3-on-surface-variant);
}

.meta-value {
  font-size: 15px;
  font-weight: 500;
}

.mine-badge {
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
}

.due-text--overdue {
  color: var(--md3-error);
  font-weight: 600;
}

.due-text--dueSoon {
  color: var(--md3-warning);
  font-weight: 600;
}

/* Notes */
.details-notes {
  padding: 0 24px 8px;
}

.details-actions {
  padding: 12px 20px 16px;
}
</style>

<i18n lang="yaml" locale="en">
allChecked: 'All items checked'
notSaved: 'Details not saved'
checklist: '{done}/{total} checked'
noDueDate: 'No due date'
noNotes: 'No details'
unassigned: 'Unassigned'
you: 'You'
field:
  title: 'Title'
  dueDate: 'Due date'
  assignee: 'Assignee'
  notes: 'Details'
action:
  clearAssignee: 'Remove assignee'
  complete: 'Complete task'
  retry: 'Try again'
  clearDueDate: 'Remove due date'
  delete: 'Delete'
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
allChecked: 'Alle Punkte abgehakt'
notSaved: 'Details nicht gespeichert'
checklist: '{done}/{total} abgehakt'
noDueDate: 'Kein Fälligkeitsdatum'
noNotes: 'Keine Details'
unassigned: 'Nicht zugewiesen'
you: 'Du'
field:
  title: 'Titel'
  dueDate: 'Fälligkeitsdatum'
  assignee: 'Zuständig'
  notes: 'Details'
action:
  clearAssignee: 'Zuständigkeit entfernen'
  complete: 'Aufgabe abschließen'
  retry: 'Erneut versuchen'
  clearDueDate: 'Fälligkeitsdatum entfernen'
  delete: 'Löschen'
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
allChecked: 'Tous les éléments sont cochés'
notSaved: 'Détails non enregistrés'
checklist: '{done}/{total} cochés'
noDueDate: "Pas d'échéance"
noNotes: 'Aucun détail'
unassigned: 'Non assignée'
you: 'Toi'
field:
  title: 'Titre'
  dueDate: 'Date d’échéance'
  assignee: 'Assigné à'
  notes: 'Détails'
action:
  clearAssignee: 'Retirer l’assignation'
  complete: 'Terminer la tâche'
  retry: 'Réessayer'
  clearDueDate: 'Retirer l’échéance'
  delete: 'Supprimer'
  close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
allChecked: 'Wszystkie punkty odhaczone'
notSaved: 'Szczegóły nie zostały zapisane'
checklist: '{done}/{total} odhaczonych'
noDueDate: 'Brak terminu'
noNotes: 'Brak szczegółów'
unassigned: 'Nieprzypisane'
you: 'Ty'
field:
  title: 'Tytuł'
  dueDate: 'Termin'
  assignee: 'Przypisane do'
  notes: 'Szczegóły'
action:
  clearAssignee: 'Usuń przypisanie'
  complete: 'Zakończ zadanie'
  retry: 'Spróbuj ponownie'
  clearDueDate: 'Usuń termin'
  delete: 'Usuń'
  close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
allChecked: 'Všechny položky odškrtnuty'
notSaved: 'Podrobnosti nebyly uloženy'
checklist: '{done}/{total} odškrtnuto'
noDueDate: 'Bez termínu'
noNotes: 'Žádné podrobnosti'
unassigned: 'Nepřiřazeno'
you: 'Ty'
field:
  title: 'Název'
  dueDate: 'Termín'
  assignee: 'Přiřazeno'
  notes: 'Podrobnosti'
action:
  clearAssignee: 'Odebrat přiřazení'
  complete: 'Dokončit úkol'
  retry: 'Zkusit znovu'
  clearDueDate: 'Odebrat termín'
  delete: 'Smazat'
  close: 'Zavřít'
</i18n>
