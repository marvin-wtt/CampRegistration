<template>
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <div class="tasks-content col-12 col-md-11 col-lg-10 column q-gutter-y-lg">
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

        <div
          v-if="can('event.tasks.create')"
          class="col-12 col-sm-auto"
        >
          <m-btn
            :label="t('action.add')"
            color="primary"
            icon="add_task"
            class="full-width"
            @click="showAddDialog"
          />
        </div>
      </div>

      <!-- Loading skeleton (data region only; header stays real) -->
      <task-list-skeleton v-if="loading" />

      <!-- Empty state -->
      <div
        v-else-if="tasks.length === 0"
        class="empty-state col column items-center justify-center"
      >
        <q-icon
          name="task_alt"
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
          v-if="can('event.tasks.create')"
          class="q-mt-lg"
          :label="t('action.add')"
          color="primary"
          icon="add_task"
          @click="showAddDialog"
        />
      </div>

      <template v-else>
        <!-- Filter -->
        <div class="row items-center filter-row">
          <q-chip
            v-for="option in filterOptions"
            :key="option.value"
            :icon="option.icon"
            clickable
            class="filter-chip"
            :class="{ 'filter-chip--active': filter === option.value }"
            @click="filter = option.value"
          >
            {{ option.label }}
          </q-chip>
        </div>

        <!-- Open tasks -->
        <q-list
          v-if="openTasks.length > 0"
          separator
        >
          <task-row
            v-for="task in openTasks"
            :key="task.id"
            :task="task"
            :mine="isMine(task)"
            :can-update="can('event.tasks.update')"
            :can-delete="can('event.tasks.delete')"
            :assignee-label="assigneeLabel(task)"
            @toggle="taskStore.toggleCompleted(task)"
            @open="showDetailsDialog(task)"
            @edit="showEditDialog(task)"
            @delete="showDeleteDialog(task)"
          />
        </q-list>
        <div
          v-else
          class="row items-center q-gutter-x-sm text-body2 text-grey-6"
        >
          <q-icon
            :name="filteredTasks.length > 0 ? 'task_alt' : 'filter_alt_off'"
            size="20px"
          />
          <span>
            {{ filteredTasks.length > 0 ? t('allDone') : t('noMatch') }}
          </span>
        </div>

        <!-- Completed tasks: tucked away -->
        <div v-if="completedTasks.length > 0">
          <q-item
            clickable
            class="completed-toggle"
            @click="showCompleted = !showCompleted"
          >
            <q-item-section class="text-grey-7 text-weight-medium">
              {{
                showCompleted
                  ? t('action.hideCompleted')
                  : t('action.toggleCompleted', {
                      count: completedTasks.length,
                    })
              }}
            </q-item-section>
            <q-item-section side>
              <q-icon
                :name="showCompleted ? 'expand_less' : 'expand_more'"
                color="grey-7"
              />
            </q-item-section>
          </q-item>
          <q-list
            v-if="showCompleted"
            separator
            class="q-mt-sm"
          >
            <task-row
              v-for="task in completedTasks"
              :key="task.id"
              :task="task"
              :mine="isMine(task)"
              :can-update="can('event.tasks.update')"
              :can-delete="can('event.tasks.delete')"
              :assignee-label="assigneeLabel(task)"
              @toggle="taskStore.toggleCompleted(task)"
              @open="showDetailsDialog(task)"
              @edit="showEditDialog(task)"
              @delete="showDeleteDialog(task)"
            />
          </q-list>
        </div>
      </template>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useTaskStore } from '@/stores/task-store';
import { useEventManagerStore } from '@/stores/event-manager-store';
import { computed, ref, watch } from 'vue';
import type { Task } from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from '@/components/common/dialogs/SafeDeleteDialog.vue';
import TaskFormDialog from '@/components/event/tasks/dialogs/TaskFormDialog.vue';
import TaskDetailsDialog from '@/components/event/tasks/dialogs/TaskDetailsDialog.vue';
import TaskRow from '@/components/event/tasks/TaskRow.vue';
import TaskListSkeleton from '@/components/event/tasks/TaskListSkeleton.vue';
import { usePermissions } from '@/composables/permissions';
import { useCurrentManager } from '@/composables/currentManager';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const quasar = useQuasar();
const { t } = useI18n();
const taskStore = useTaskStore();
const eventManagerStore = useEventManagerStore();
const { can } = usePermissions();
const { currentManagerId } = useCurrentManager();

const showCompleted = ref<boolean>(false);

type TaskFilter = 'all' | 'mine' | 'unassigned';
const filter = ref<TaskFilter>('all');

const filterOptions = computed<
  { value: TaskFilter; icon: string; label: string }[]
>(() => [
  { value: 'all', icon: 'checklist', label: t('filter.all') },
  { value: 'mine', icon: 'person', label: t('filter.mine') },
  { value: 'unassigned', icon: 'person_off', label: t('filter.unassigned') },
]);

// The roster is only needed to populate the assignee picker; every role that can
// create or update a task also holds `event.managers.view`.
const canAssign = computed<boolean>(
  () => can('event.tasks.create') || can('event.tasks.update'),
);

// Started during setup, not awaited: the stores flag themselves loading before
// the first render, so the page renders its skeletons instead of an idle frame.
void taskStore.fetchData();

// Permissions resolve with the profile and the event, both of which the parent
// layout loads after this page mounts — so the roster has to be fetched when
// the answer arrives, not once at mount.
watch(
  canAssign,
  (allowed) => {
    if (allowed) {
      void eventManagerStore.fetchData();
    }
  },
  { immediate: true },
);

const error = computed<string | null>(() => {
  return taskStore.error;
});

const loading = computed<boolean>(() => taskStore.isLoading);

const tasks = computed<Task[]>(() => {
  return taskStore.data ?? [];
});

function isMine(task: Task): boolean {
  return (
    currentManagerId.value !== undefined &&
    task.assigneeId === currentManagerId.value
  );
}

function sortByDueDate(list: Task[]): Task[] {
  return [...list].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) {
      return 0;
    }
    if (!a.dueDate) {
      return 1;
    }
    if (!b.dueDate) {
      return -1;
    }
    return a.dueDate.localeCompare(b.dueDate);
  });
}

const filteredTasks = computed<Task[]>(() => {
  if (filter.value === 'mine') {
    return tasks.value.filter((task) => isMine(task));
  }
  if (filter.value === 'unassigned') {
    return tasks.value.filter((task) => !task.assigneeId);
  }
  return tasks.value;
});

const openTasks = computed<Task[]>(() => {
  return sortByDueDate(filteredTasks.value.filter((task) => !task.completed));
});

const completedTasks = computed<Task[]>(() => {
  return sortByDueDate(filteredTasks.value.filter((task) => task.completed));
});

// The real assignee name (never "You") — used where a badge conveys ownership.
function assigneeName(task: Task): string {
  if (!task.assignee) {
    return t('unassigned');
  }

  return task.assignee.name ?? task.assignee.email;
}

// Compact label for list rows: shows "You" for the current user's tasks.
function assigneeLabel(task: Task): string {
  if (isMine(task)) {
    return t('you');
  }

  return assigneeName(task);
}

function showDetailsDialog(task: Task) {
  quasar
    .dialog({
      component: TaskDetailsDialog,
      componentProps: {
        task,
        mine: isMine(task),
        canUpdate: can('event.tasks.update'),
        canDelete: can('event.tasks.delete'),
        assigneeLabel: assigneeName(task),
      },
    })
    .onOk((result: { action: 'edit' | 'delete' }) => {
      if (result.action === 'edit') {
        showEditDialog(task);
      } else if (result.action === 'delete') {
        showDeleteDialog(task);
      }
    });
}

function showAddDialog() {
  quasar
    .dialog({
      component: TaskFormDialog,
      componentProps: {
        managers: eventManagerStore.data ?? [],
      },
    })
    .onOk((data) => {
      void taskStore.createData(data);
    });
}

function showEditDialog(task: Task) {
  quasar
    .dialog({
      component: TaskFormDialog,
      componentProps: {
        task,
        managers: eventManagerStore.data ?? [],
      },
    })
    .onOk((data) => {
      void taskStore.updateData(task.id, data);
    });
}

function showDeleteDialog(task: Task) {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message: t('dialog.delete.message'),
        label: t('dialog.delete.label'),
        value: task.title,
      },
    })
    .onOk(() => {
      void taskStore.deleteData(task.id);
    });
}
</script>

<style scoped>
.tasks-content {
  max-width: 960px;
  padding-bottom: 24px;
}

.empty-state {
  padding: 48px 16px;
}

.empty-icon {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
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

.completed-toggle {
  min-height: 44px;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Tasks'
subtitle: 'Keep track of to-dos for this event.'
unassigned: 'Unassigned'
you: 'You'
allDone: 'No open tasks — nice work!'
noMatch: 'No tasks match this filter.'

filter:
  all: 'All'
  mine: 'Mine'
  unassigned: 'Unassigned'

action:
  add: 'Add task'
  toggleCompleted: 'Show completed ({count})'
  hideCompleted: 'Hide completed'

dialog:
  delete:
    title: 'Delete task'
    message: 'Do you really want to delete this task?'
    label: 'Title'

empty:
  title: 'No tasks yet'
  message: 'Add a task to keep track of to-dos for this event.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Aufgaben'
subtitle: 'Behalte die Aufgaben für diese Veranstaltung im Blick.'
unassigned: 'Nicht zugewiesen'
you: 'Du'
allDone: 'Keine offenen Aufgaben — gut gemacht!'
noMatch: 'Keine Aufgaben entsprechen diesem Filter.'

filter:
  all: 'Alle'
  mine: 'Meine'
  unassigned: 'Nicht zugewiesen'

action:
  add: 'Aufgabe hinzufügen'
  toggleCompleted: 'Erledigte anzeigen ({count})'
  hideCompleted: 'Erledigte ausblenden'

dialog:
  delete:
    title: 'Aufgabe löschen'
    message: 'Möchtest du diese Aufgabe wirklich löschen?'
    label: 'Titel'

empty:
  title: 'Noch keine Aufgaben'
  message: 'Füge eine Aufgabe hinzu, um die To-dos für diese Veranstaltung im Blick zu behalten.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Tâches'
subtitle: 'Suis les tâches à faire pour cet événement.'
unassigned: 'Non assignée'
you: 'Toi'
allDone: 'Aucune tâche en cours — bien joué !'
noMatch: 'Aucune tâche ne correspond à ce filtre.'

filter:
  all: 'Toutes'
  mine: 'Les miennes'
  unassigned: 'Non assignées'

action:
  add: 'Ajouter une tâche'
  toggleCompleted: 'Afficher terminées ({count})'
  hideCompleted: 'Masquer terminées'

dialog:
  delete:
    title: 'Supprimer la tâche'
    message: 'Veux-tu vraiment supprimer cette tâche ?'
    label: 'Titre'

empty:
  title: 'Aucune tâche pour le moment'
  message: 'Ajoute une tâche pour suivre les choses à faire pour cet événement.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zadania'
subtitle: 'Śledź zadania do wykonania dla tego wydarzenia.'
unassigned: 'Nieprzypisane'
you: 'Ty'
allDone: 'Brak otwartych zadań — świetna robota!'
noMatch: 'Żadne zadania nie pasują do tego filtra.'

filter:
  all: 'Wszystkie'
  mine: 'Moje'
  unassigned: 'Nieprzypisane'

action:
  add: 'Dodaj zadanie'
  toggleCompleted: 'Pokaż ukończone ({count})'
  hideCompleted: 'Ukryj ukończone'

dialog:
  delete:
    title: 'Usuń zadanie'
    message: 'Czy na pewno chcesz usunąć to zadanie?'
    label: 'Tytuł'

empty:
  title: 'Brak zadań'
  message: 'Dodaj zadanie, aby śledzić rzeczy do zrobienia dla tego wydarzenia.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Úkoly'
subtitle: 'Sleduj úkoly pro tuto akci.'
unassigned: 'Nepřiřazeno'
you: 'Ty'
allDone: 'Žádné otevřené úkoly — skvělá práce!'
noMatch: 'Žádné úkoly neodpovídají tomuto filtru.'

filter:
  all: 'Vše'
  mine: 'Moje'
  unassigned: 'Nepřiřazené'

action:
  add: 'Přidat úkol'
  toggleCompleted: 'Zobrazit dokončené ({count})'
  hideCompleted: 'Skrýt dokončené'

dialog:
  delete:
    title: 'Smazat úkol'
    message: 'Opravdu chceš tento úkol smazat?'
    label: 'Název'

empty:
  title: 'Zatím žádné úkoly'
  message: 'Přidej úkol a sleduj, co je třeba pro tuto akci udělat.'
</i18n>
