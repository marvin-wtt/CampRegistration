<template>
  <page-state-handler
    padding
    :error
    :loading
    class="tasks-page row justify-center"
  >
    <div class="tasks-content col-12 col-md-11 col-lg-10 column q-gutter-y-lg">
      <!-- Header -->
      <div class="row items-end justify-between q-col-gutter-y-sm">
        <div class="col-12 col-sm page-title">
          <div class="text-h5 text-weight-medium">
            {{ t('title') }}
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            {{ t('subtitle') }}
          </div>
        </div>

        <div
          v-if="can('camp.tasks.create')"
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

      <!-- Task list -->
      <q-card
        v-if="tasks.length > 0"
        flat
        bordered
        class="section-card"
      >
        <div class="filter-bar">
          <q-btn-toggle
            v-model="filter"
            :options="filterOptions"
            no-caps
            unelevated
            rounded
            dense
            toggle-color="primary"
            color="transparent"
            text-color="grey-7"
            class="task-filter"
          />
        </div>
        <q-separator />

        <q-card-section class="q-px-none q-pb-xs">
          <q-list v-if="openTasks.length > 0">
            <task-row
              v-for="task in openTasks"
              :key="task.id"
              :task="task"
              :mine="isMine(task)"
              :can-update="can('camp.tasks.update')"
              :can-delete="can('camp.tasks.delete')"
              :assignee-label="assigneeLabel(task)"
              @toggle="taskStore.toggleCompleted(task)"
              @open="showDetailsDialog(task)"
              @edit="showEditDialog(task)"
              @delete="showDeleteDialog(task)"
            />
          </q-list>
          <div
            v-else
            class="all-done column items-center text-center q-py-lg"
          >
            <q-icon
              :name="filteredTasks.length > 0 ? 'task_alt' : 'filter_alt_off'"
              size="32px"
              class="empty-icon"
            />
            <div class="text-body2 text-grey-6 q-mt-sm">
              {{ filteredTasks.length > 0 ? t('allDone') : t('noMatch') }}
            </div>
          </div>
        </q-card-section>

        <template v-if="completedTasks.length > 0">
          <q-separator />
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
            class="q-pb-xs"
          >
            <task-row
              v-for="task in completedTasks"
              :key="task.id"
              :task="task"
              :mine="isMine(task)"
              :can-update="can('camp.tasks.update')"
              :can-delete="can('camp.tasks.delete')"
              :assignee-label="assigneeLabel(task)"
              @toggle="taskStore.toggleCompleted(task)"
              @open="showDetailsDialog(task)"
              @edit="showEditDialog(task)"
              @delete="showDeleteDialog(task)"
            />
          </q-list>
        </template>
      </q-card>

      <!-- Empty state -->
      <q-card
        v-else
        flat
        bordered
        class="section-card"
      >
        <q-card-section class="column items-center text-center q-pa-xl">
          <q-icon
            name="task_alt"
            size="56px"
            class="empty-icon"
          />
          <div class="text-subtitle1 text-weight-medium q-mt-md">
            {{ t('empty.title') }}
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            {{ t('empty.message') }}
          </div>
          <m-btn
            v-if="can('camp.tasks.create')"
            :label="t('action.add')"
            color="primary"
            icon="add_task"
            class="q-mt-md"
            @click="showAddDialog"
          />
        </q-card-section>
      </q-card>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useTaskStore } from 'stores/task-store';
import { useCampManagerStore } from 'stores/camp-manager-store';
import { computed, onMounted, ref } from 'vue';
import type { Task } from '@camp-registration/common/entities';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import TaskFormDialog from 'components/campManagement/tasks/dialogs/TaskFormDialog.vue';
import TaskDetailsDialog from 'components/campManagement/tasks/dialogs/TaskDetailsDialog.vue';
import TaskRow from 'components/campManagement/tasks/TaskRow.vue';
import { usePermissions } from 'src/composables/permissions';
import { useCurrentManager } from 'src/composables/currentManager';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const quasar = useQuasar();
const { t } = useI18n();
const taskStore = useTaskStore();
const campManagerStore = useCampManagerStore();
const { can } = usePermissions();
const { currentManagerId } = useCurrentManager();

const showCompleted = ref<boolean>(false);

type TaskFilter = 'all' | 'mine' | 'unassigned';
const filter = ref<TaskFilter>('all');

const filterOptions = computed(() => [
  { label: t('filter.all'), value: 'all' },
  { label: t('filter.mine'), value: 'mine' },
  { label: t('filter.unassigned'), value: 'unassigned' },
]);

onMounted(async () => {
  await Promise.allSettled([
    taskStore.fetchData(),
    campManagerStore.fetchData(),
  ]);
});

const error = computed<string | null>(() => {
  return taskStore.error ?? campManagerStore.error;
});

const loading = computed<boolean>(() => {
  return taskStore.isLoading || campManagerStore.isLoading;
});

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
  if (!task.assigneeId) {
    return t('unassigned');
  }

  const manager = campManagerStore.data?.find((m) => m.id === task.assigneeId);

  return manager?.name ?? manager?.email ?? t('unassigned');
}

// Compact label for list rows: shows "You" for the current user's tasks.
function assigneeLabel(task: Task): string {
  if (task.assigneeId && task.assigneeId === currentManagerId.value) {
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
        canUpdate: can('camp.tasks.update'),
        canDelete: can('camp.tasks.delete'),
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
        managers: campManagerStore.data ?? [],
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
        managers: campManagerStore.data ?? [],
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

@media (max-width: 599px) {
  .tasks-page {
    padding-top: 24px;
  }
}

.section-card {
  border-radius: 16px;
}

.filter-bar {
  display: flex;
  padding: 10px 12px;
}

/* Segmented "track" around the toggle so the selected pill reads clearly. */
.task-filter {
  background: var(--md3-surface-container-high);
  border-radius: 999px;
  padding: 3px;
}

.task-filter :deep(.q-btn) {
  padding: 4px 14px;
}

.empty-icon {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}

.completed-toggle {
  min-height: 44px;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Tasks'
subtitle: 'Keep track of to-dos for this camp.'
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
  message: 'Add a task to keep track of to-dos for this camp.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Aufgaben'
subtitle: 'Behalte die Aufgaben für dieses Camp im Blick.'
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
  message: 'Füge eine Aufgabe hinzu, um die To-dos für dieses Camp im Blick zu behalten.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Tâches'
subtitle: 'Suis les tâches à faire pour ce camp.'
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
  message: 'Ajoute une tâche pour suivre les choses à faire pour ce camp.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zadania'
subtitle: 'Śledź zadania do wykonania dla tego obozu.'
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
  message: 'Dodaj zadanie, aby śledzić rzeczy do zrobienia dla tego obozu.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Úkoly'
subtitle: 'Sleduj úkoly pro tento tábor.'
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
  message: 'Přidej úkol a sleduj, co je třeba pro tento tábor udělat.'
</i18n>
