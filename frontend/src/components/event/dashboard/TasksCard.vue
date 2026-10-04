<template>
  <q-card
    flat
    bordered
    class="tasks-card"
  >
    <q-card-section>
      <dashboard-card-header
        :icon="!loading && openTasks.length === 0 ? 'task_alt' : 'checklist'"
        :tone="!loading && openTasks.length === 0 ? 'positive' : 'primary'"
        :title="t('title')"
        :link="{
          label: t('action.allTasks'),
          to: { name: 'management.event.tasks' },
        }"
      >
        <template #caption>
          <q-skeleton
            v-if="loading"
            type="text"
            width="40%"
          />
          <template v-else-if="openTasks.length === 0">{{
            t('empty')
          }}</template>
          <template v-else>
            {{
              dueCount > 0
                ? t('summary.due', { count: dueCount })
                : t('summary.open', openTasks.length)
            }}
            <span
              v-if="mineCount > 0"
              class="mine-summary"
            >
              · {{ t('summary.mine', mineCount) }}
            </span>
          </template>
        </template>
      </dashboard-card-header>
    </q-card-section>

    <q-list
      v-if="loading"
      class="todo-list"
    >
      <q-item
        v-for="width in ['70%', '55%', '62%']"
        :key="width"
      >
        <q-item-section>
          <q-skeleton
            type="text"
            :width="width"
          />
        </q-item-section>
      </q-item>
    </q-list>
    <q-card-section
      v-else-if="upcomingTasks.length > 0"
      class="tasks-section"
    >
      <q-list class="tasks-list">
        <q-item
          v-for="task in upcomingTasks"
          :key="task.id"
          clickable
          :to="{ name: 'management.event.tasks' }"
          class="task-item"
          :class="{ 'task-item--mine': isMine(task) }"
        >
          <q-item-section
            avatar
            class="due-marker-section"
          >
            <span
              class="due-marker"
              :class="`due-marker--${taskPhaseOf(task)}`"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label class="row items-center no-wrap q-gutter-x-xs">
              <span class="ellipsis">{{ task.title }}</span>
              <q-badge
                v-if="isMine(task)"
                class="mine-badge"
                color="primary"
                :label="t('you')"
              />
            </q-item-label>
          </q-item-section>
          <q-item-section
            side
            class="due-date-section"
            :class="`due-text--${taskPhaseOf(task)}`"
          >
            {{ task.dueDate ? d(parseLocalDate(task.dueDate), 'date') : '—' }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import { useTaskStore } from '@/stores/task-store';
import { useCurrentManager } from '@/composables/currentManager';
import type { Task } from '@camp-registration/common/entities';
import { taskPhaseOf } from '@/utils/taskPhase';
import { parseLocalDate } from '@/utils/date';

// Open tasks the team created, unassigned or the manager's own first.
const { loading = false } = defineProps<{
  loading?: boolean;
}>();

const { t, d } = useI18n();
const taskStore = useTaskStore();
const { currentManagerId } = useCurrentManager();

const openTasks = computed<Task[]>(() =>
  (taskStore.data ?? []).filter((task) => !task.completed),
);

const upcomingTasks = computed<Task[]>(() => {
  return openTasks.value
    .filter(
      (task) =>
        task.assigneeId === null || task.assigneeId === currentManagerId.value,
    )
    .sort((a, b) => {
      if (a.dueDate === b.dueDate) {
        return Number(isMine(b)) - Number(isMine(a));
      }
      if (!a.dueDate) {
        return 1;
      }
      if (!b.dueDate) {
        return -1;
      }
      return a.dueDate.localeCompare(b.dueDate);
    })
    .slice(0, 5);
});

const dueCount = computed<number>(
  () =>
    openTasks.value.filter((task) => {
      const taskPhase = taskPhaseOf(task);
      return taskPhase === 'overdue' || taskPhase === 'dueSoon';
    }).length,
);

const mineCount = computed<number>(() => openTasks.value.filter(isMine).length);

function isMine(task: Task): boolean {
  return (
    currentManagerId.value !== undefined &&
    task.assigneeId === currentManagerId.value
  );
}
</script>

<style scoped>
.tasks-card {
  border-radius: 16px;
}

.tasks-section {
  padding-top: 0;
}

.tasks-list {
  padding: 0;
}

.todo-list {
  padding: 0 8px 8px;
}

.task-item {
  min-height: 44px;
  padding-right: 8px;
  padding-left: 8px;
  border-radius: 8px;
}

.task-item + .task-item {
  margin-top: 2px;
}

.task-item--mine {
  padding-left: 5px;
  background: color-mix(in srgb, var(--md3-primary) 5%, transparent);
  border-left: 3px solid var(--md3-primary);
  border-radius: 0 8px 8px 0;
}

.due-marker-section {
  min-width: 0;
  padding-right: 12px;
}

.due-marker {
  width: 10px;
  height: 10px;
  background: var(--md3-outline);
  border-radius: 50%;
}

.due-marker--overdue {
  background: var(--md3-error);
}

.due-marker--dueSoon {
  background: var(--md3-warning);
}

.mine-badge {
  flex: 0 0 auto;
  font-size: 10px;
  font-weight: 600;
  border-radius: 6px;
}

.mine-summary {
  color: var(--md3-primary);
  font-weight: 500;
}

.due-date-section {
  color: var(--md3-on-surface-variant);
  font-size: 12px;
  white-space: nowrap;
}

.due-text--overdue {
  color: var(--md3-error);
  font-weight: 600;
}

.due-text--dueSoon {
  color: var(--md3-warning);
  font-weight: 600;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Tasks'
empty: 'No open tasks'
you: 'You'
summary:
  due: '{count} due soon'
  open: '{n} open task | {n} open tasks'
  mine: '{n} assigned to you'
action:
  allTasks: 'All tasks'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Aufgaben'
empty: 'Keine offenen Aufgaben'
you: 'Du'
summary:
  due: '{count} bald fällig'
  open: '{n} offene Aufgabe | {n} offene Aufgaben'
  mine: '{n} dir zugewiesen'
action:
  allTasks: 'Alle Aufgaben'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Tâches'
empty: 'Aucune tâche ouverte'
you: 'Toi'
summary:
  due: '{count} à échéance proche'
  open: '{n} tâche ouverte | {n} tâches ouvertes'
  mine: '{n} assignée à toi | {n} assignées à toi'
action:
  allTasks: 'Toutes les tâches'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zadania'
empty: 'Brak otwartych zadań'
you: 'Ty'
summary:
  due: '{count} na wkrótce'
  open: '{n} otwarte zadanie | {n} otwarte zadania'
  mine: '{n} przypisane do ciebie'
action:
  allTasks: 'Wszystkie zadania'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Úkoly'
empty: 'Žádné otevřené úkoly'
you: 'Ty'
summary:
  due: '{count} s blížícím se termínem'
  open: '{n} otevřený úkol | {n} otevřené úkoly'
  mine: '{n} přiřazen tobě'
action:
  allTasks: 'Všechny úkoly'
</i18n>
