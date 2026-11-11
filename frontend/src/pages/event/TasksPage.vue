<template>
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <div
      class="tasks-content col-12 col-md-11 col-lg-10 column no-wrap q-gutter-y-lg"
    >
      <page-header
        :title="t('title')"
        :subtitle="t('subtitle')"
      >
        <template #actions>
          <template v-if="can('event.tasks.create')">
            <m-btn
              :label="t('action.add')"
              color="primary"
              icon="add_task"
              @click="showAddDialog"
            />
          </template>
        </template>
      </page-header>

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
        <div class="row items-center no-wrap filter-row">
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

        <q-list
          v-if="openTasks.length > 0"
          separator
          class="task-list"
        >
          <transition-group name="task-row">
            <task-row
              v-for="task in openTasks"
              :key="task.id"
              :task="shown(task)"
              :mine="isMine(task)"
              :can-update="can('event.tasks.update')"
              :can-delete="can('event.tasks.delete')"
              :assignee-label="assigneeLabel(task)"
              @toggle="toggle(task)"
              @open="showDetailsDialog(task)"
              @delete="showDeleteDialog(task)"
            />
          </transition-group>
        </q-list>
        <div
          v-else
          class="row items-center q-gutter-x-sm text-body2 text-grey-6"
        >
          <q-icon
            :name="emptyHint.icon"
            size="20px"
          />
          <span>{{ emptyHint.text }}</span>
        </div>

        <div
          v-if="completedTasks.length > 0"
          class="column no-wrap"
        >
          <q-btn
            :label="t('completed', { count: completedTasks.length })"
            :icon-right="showCompleted ? 'expand_less' : 'expand_more'"
            text-color="on-surface-variant"
            class="self-start"
            flat
            dense
            rounded
            no-caps
            data-test="task-completed-toggle"
            @click="showCompleted = !showCompleted"
          />
          <q-slide-transition>
            <q-list
              v-show="showCompleted"
              separator
              class="task-list q-mt-sm"
            >
              <transition-group name="task-row">
                <task-row
                  v-for="task in completedTasks"
                  :key="task.id"
                  :task="shown(task)"
                  :mine="isMine(task)"
                  :can-update="can('event.tasks.update')"
                  :can-delete="can('event.tasks.delete')"
                  :assignee-label="assigneeLabel(task)"
                  @toggle="toggle(task)"
                  @open="showDetailsDialog(task)"
                  @delete="showDeleteDialog(task)"
                />
              </transition-group>
            </q-list>
          </q-slide-transition>
        </div>
      </template>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageHeader from '@/components/common/PageHeader.vue';
import { useI18n } from 'vue-i18n';
import { useTaskStore } from '@/stores/task-store';
import { computed, ref } from 'vue';
import type { Task } from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import TaskRow from '@/components/event/tasks/TaskRow.vue';
import TaskListSkeleton from '@/components/event/tasks/TaskListSkeleton.vue';
import { usePermissions } from '@/composables/permissions';
import { useCurrentManager } from '@/composables/currentManager';
import { useTaskDialogs } from '@/composables/taskDialogs';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const { t } = useI18n();
const taskStore = useTaskStore();
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

// Started during setup, not awaited: the stores flag themselves loading before
// the first render, so the page renders its skeletons instead of an idle frame.
void taskStore.fetchData();

const {
  showDetails: showDetailsDialog,
  showAdd: showAddDialog,
  showDelete: showDeleteDialog,
} = useTaskDialogs();

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

// A toggled task stays in its list for a moment, already showing its new
// state, before it moves — so the click reads as done, not as vanished.
const SETTLE_MS = 700;
const settling = ref(new Map<string, boolean>());

function listedAsCompleted(task: Task): boolean {
  return settling.value.get(task.id) ?? task.completed;
}

function shown(task: Task): Task {
  const completed = settling.value.get(task.id);
  return completed === undefined ? task : { ...task, completed: !completed };
}

async function toggle(task: Task) {
  if (settling.value.has(task.id)) {
    return;
  }

  settling.value.set(task.id, task.completed);
  try {
    await Promise.all([
      taskStore.toggleCompleted(task),
      new Promise((resolve) => setTimeout(resolve, SETTLE_MS)),
    ]);
  } finally {
    settling.value.delete(task.id);
  }
}

const openTasks = computed<Task[]>(() => {
  return sortByDueDate(
    filteredTasks.value.filter((task) => !listedAsCompleted(task)),
  );
});

const completedTasks = computed<Task[]>(() => {
  return sortByDueDate(
    filteredTasks.value.filter((task) => listedAsCompleted(task)),
  );
});

const emptyHint = computed<{ icon: string; text: string }>(() =>
  filteredTasks.value.length === 0
    ? { icon: 'filter_alt_off', text: t('noMatch') }
    : { icon: 'task_alt', text: t('allDone') },
);

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
</script>

<style scoped>
.tasks-content {
  max-width: 960px;
  padding-bottom: 24px;
}

.task-list {
  position: relative;
}

.task-row-move,
.task-row-enter-active,
.task-row-leave-active {
  transition:
    transform 300ms cubic-bezier(0.2, 0, 0, 1),
    opacity 300ms cubic-bezier(0.2, 0, 0, 1);
}

.task-row-enter-from,
.task-row-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Taken out of the flow so the remaining rows can slide into its place. */
.task-row-leave-active {
  position: absolute;
  left: 0;
  right: 0;
}

@media (prefers-reduced-motion: reduce) {
  .task-row-move,
  .task-row-enter-active,
  .task-row-leave-active {
    transition: none;
  }
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
  overflow-x: auto;
  scrollbar-width: none;
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
</style>

<i18n lang="yaml" locale="en">
title: 'Tasks'
subtitle: 'Keep track of to-dos for this event.'
unassigned: 'Unassigned'
you: 'You'
allDone: 'No open tasks — nice work!'
noMatch: 'No tasks match this filter.'

completed: 'Completed ({count})'

filter:
  all: 'All'
  mine: 'Mine'
  unassigned: 'Unassigned'

action:
  add: 'Add task'

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

completed: 'Erledigt ({count})'

filter:
  all: 'Alle'
  mine: 'Meine'
  unassigned: 'Nicht zugewiesen'

action:
  add: 'Aufgabe hinzufügen'

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

completed: 'Terminées ({count})'

filter:
  all: 'Toutes'
  mine: 'Les miennes'
  unassigned: 'Non assignées'

action:
  add: 'Ajouter une tâche'

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

completed: 'Ukończone ({count})'

filter:
  all: 'Wszystkie'
  mine: 'Moje'
  unassigned: 'Nieprzypisane'

action:
  add: 'Dodaj zadanie'

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

completed: 'Dokončené ({count})'

filter:
  all: 'Vše'
  mine: 'Moje'
  unassigned: 'Nepřiřazené'

action:
  add: 'Přidat úkol'

empty:
  title: 'Zatím žádné úkoly'
  message: 'Přidej úkol a sleduj, co je třeba pro tuto akci udělat.'
</i18n>
