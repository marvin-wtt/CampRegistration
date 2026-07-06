<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="task-details">
      <!-- Header -->
      <div class="details-header">
        <div class="row items-start no-wrap q-gutter-sm">
          <div
            class="details-title col"
            :class="{ 'details-title--done': task.completed }"
          >
            {{ task.title }}
          </div>
          <div
            class="status-chip"
            :class="task.completed ? 'status-chip--done' : 'status-chip--open'"
          >
            <q-icon
              :name="task.completed ? 'task_alt' : 'radio_button_unchecked'"
              size="14px"
            />
            {{ task.completed ? t('status.done') : t('status.open') }}
          </div>
        </div>
      </div>

      <!-- Meta -->
      <div class="details-meta">
        <div class="meta-row">
          <div
            class="meta-icon"
            :class="`meta-icon--${phase}`"
          >
            <q-icon
              name="event"
              size="18px"
            />
          </div>
          <div class="col">
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
          </div>
        </div>

        <div class="meta-row">
          <div class="meta-icon">
            <q-icon
              name="person"
              size="18px"
            />
          </div>
          <div class="col">
            <div class="meta-label">{{ t('field.assignee') }}</div>
            <div class="meta-value row items-center q-gutter-x-xs">
              <span>{{ assigneeLabel }}</span>
              <q-badge
                v-if="mine"
                class="mine-badge"
                color="primary"
                :label="t('you')"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="details-notes">
        <div class="meta-label q-mb-xs">{{ t('field.notes') }}</div>
        <div
          v-if="task.notes"
          class="notes-box"
        >
          {{ task.notes }}
        </div>
        <div
          v-else
          class="text-body2 text-grey-6"
        >
          {{ t('noNotes') }}
        </div>
      </div>

      <q-card-actions class="details-actions">
        <q-btn
          v-if="canDelete"
          :label="t('action.delete')"
          color="negative"
          flat
          rounded
          @click="onDelete"
        />
        <q-space />
        <q-btn
          :label="t('action.close')"
          flat
          rounded
          @click="onDialogCancel"
        />
        <q-btn
          v-if="canUpdate"
          :label="t('action.edit')"
          color="primary"
          unelevated
          rounded
          icon="edit"
          @click="onEdit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import type { Task } from '@camp-registration/common/entities';
import { taskPhaseOf } from 'src/utils/taskPhase';
import { parseLocalDate } from 'src/utils/date';

const { t, d } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const props = defineProps<{
  task: Task;
  mine: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  assigneeLabel: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const phase = computed(() => taskPhaseOf(props.task));
const dueTextClass = computed<string>(() => `due-text--${phase.value}`);

function onEdit() {
  onDialogOK({ action: 'edit' });
}

function onDelete() {
  onDialogOK({ action: 'delete' });
}
</script>

<style scoped>
.task-details {
  width: 440px;
  max-width: 100%;
  border-radius: 20px;
}

/* Header */
.details-header {
  padding: 20px 24px 16px;
  background: color-mix(in srgb, var(--md3-primary) 7%, var(--md3-surface));
}

.details-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  word-break: break-word;
}

.details-title--done {
  color: var(--md3-on-surface-variant);
  text-decoration: line-through;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
  height: 26px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-chip--done {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.status-chip--open {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}

/* Meta */
.details-meta {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.meta-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 11px;
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

.notes-box {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--md3-surface-container-high);
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.5;
}

.details-actions {
  padding: 12px 20px 16px;
}
</style>

<i18n lang="yaml" locale="en">
noDueDate: 'No due date'
noNotes: 'No notes'
you: 'You'
status:
  open: 'Open'
  done: 'Done'
field:
  dueDate: 'Due date'
  assignee: 'Assignee'
  notes: 'Notes'
action:
  edit: 'Edit'
  delete: 'Delete'
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
noDueDate: 'Kein Fälligkeitsdatum'
noNotes: 'Keine Notizen'
you: 'Du'
status:
  open: 'Offen'
  done: 'Erledigt'
field:
  dueDate: 'Fälligkeitsdatum'
  assignee: 'Zuständig'
  notes: 'Notizen'
action:
  edit: 'Bearbeiten'
  delete: 'Löschen'
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
noDueDate: "Pas d'échéance"
noNotes: 'Aucune note'
you: 'Toi'
status:
  open: 'Ouverte'
  done: 'Terminée'
field:
  dueDate: 'Date d’échéance'
  assignee: 'Assigné à'
  notes: 'Notes'
action:
  edit: 'Modifier'
  delete: 'Supprimer'
  close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
noDueDate: 'Brak terminu'
noNotes: 'Brak notatek'
you: 'Ty'
status:
  open: 'Otwarte'
  done: 'Ukończone'
field:
  dueDate: 'Termin'
  assignee: 'Przypisane do'
  notes: 'Notatki'
action:
  edit: 'Edytuj'
  delete: 'Usuń'
  close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
noDueDate: 'Bez termínu'
noNotes: 'Žádné poznámky'
you: 'Ty'
status:
  open: 'Otevřené'
  done: 'Dokončeno'
field:
  dueDate: 'Termín'
  assignee: 'Přiřazeno'
  notes: 'Poznámky'
action:
  edit: 'Upravit'
  delete: 'Smazat'
  close: 'Zavřít'
</i18n>
