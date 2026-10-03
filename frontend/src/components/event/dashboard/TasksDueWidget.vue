<template>
  <q-card
    flat
    bordered
    class="tasks-due-card"
  >
    <q-card-section>
      <dashboard-card-header
        :icon="!loading && !hasOpenTasks ? 'task_alt' : 'checklist'"
        :tone="!loading && !hasOpenTasks ? 'positive' : 'primary'"
        :title="t('title')"
      >
        <template #caption>
          <q-skeleton
            v-if="loading"
            type="text"
            width="40%"
          />
          <template v-else-if="!hasOpenTasks">{{ t('empty') }}</template>
          <template v-else>
            {{
              dueCount > 0
                ? t('summary.due', { count: dueCount })
                : t('subtitle')
            }}
            <span
              v-if="mineCount > 0"
              class="mine-summary"
            >
              · {{ t('summary.mine', mineCount) }}
            </span>
          </template>
        </template>
        <template #action>
          <m-btn
            :label="t('action.viewAll')"
            :to="{ name: 'management.event.tasks' }"
            icon-right="chevron_right"
            primary
            text
            no-caps
          />
        </template>
      </dashboard-card-header>
    </q-card-section>

    <q-list
      v-if="loading"
      class="tasks-due-list"
    >
      <q-item
        v-for="width in ['70%', '55%', '62%']"
        :key="width"
        class="tasks-due-item"
      >
        <q-item-section
          avatar
          class="due-marker-section"
        >
          <q-skeleton
            type="circle"
            size="10px"
          />
        </q-item-section>
        <q-item-section>
          <q-skeleton
            type="text"
            :width="width"
          />
        </q-item-section>
        <q-item-section side>
          <q-skeleton
            type="text"
            width="64px"
          />
        </q-item-section>
      </q-item>
    </q-list>
    <q-list
      v-else-if="upcomingTasks.length > 0"
      class="tasks-due-list"
    >
      <q-item
        v-for="task in upcomingTasks"
        :key="task.id"
        clickable
        :to="{ name: 'management.event.tasks' }"
        class="tasks-due-item"
        :class="{ 'tasks-due-item--mine': isMine(task) }"
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
  </q-card>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import { useTaskStore } from '@/stores/task-store';
import { useCurrentManager } from '@/composables/currentManager';
import type { Task } from '@camp-registration/common/entities';
import { taskPhaseOf } from '@/utils/taskPhase';
import { parseLocalDate } from '@/utils/date';

const { loading = false } = defineProps<{
  loading?: boolean;
}>();

const { t, d } = useI18n();
const taskStore = useTaskStore();
const { currentManagerId } = useCurrentManager();

const openTasks = computed<Task[]>(() => {
  return (taskStore.data ?? []).filter((task) => !task.completed);
});

const hasOpenTasks = computed<boolean>(() => {
  return openTasks.value.length > 0;
});

const upcomingTasks = computed<Task[]>(() => {
  return [...openTasks.value]
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

const dueCount = computed<number>(() => {
  return openTasks.value.filter((task) => {
    const phase = taskPhaseOf(task);
    return phase === 'overdue' || phase === 'dueSoon';
  }).length;
});

const mineCount = computed<number>(() => {
  return openTasks.value.filter(isMine).length;
});

function isMine(task: Task): boolean {
  return (
    currentManagerId.value !== undefined &&
    task.assigneeId === currentManagerId.value
  );
}
</script>

<style scoped>
.tasks-due-card {
  border-radius: 16px;
}

.tasks-due-list {
  padding: 0 8px 8px;
}

.tasks-due-item {
  border-radius: 8px;
  min-height: 44px;
}

.due-marker-section {
  min-width: 0;
  padding-right: 12px;
}

.due-marker {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--md3-outline);
}

.due-marker--overdue {
  background: var(--md3-error);
}

.due-marker--dueSoon {
  background: var(--md3-warning);
}

.tasks-due-item + .tasks-due-item {
  margin-top: 2px;
}

.tasks-due-item--mine {
  border-left: 3px solid var(--md3-primary);
  border-radius: 0 8px 8px 0;
  padding-left: 13px;
  background: color-mix(in srgb, var(--md3-primary) 5%, transparent);
}

.mine-badge {
  flex: 0 0 auto;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
}

.mine-summary {
  color: var(--md3-primary);
  font-weight: 500;
}

.due-date-section {
  font-size: 12px;
  color: var(--md3-on-surface-variant);
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
subtitle: 'Upcoming to-dos'
empty: 'No pending tasks'
you: 'You'
summary:
  due: '{count} due soon'
  mine: '{n} assigned to you'
action:
  viewAll: 'View all'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Aufgaben'
subtitle: 'Anstehende Aufgaben'
empty: 'Keine offenen Aufgaben'
you: 'Du'
summary:
  due: '{count} bald fällig'
  mine: '{n} dir zugewiesen'
action:
  viewAll: 'Alle anzeigen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Tâches'
subtitle: 'Tâches à venir'
empty: 'Aucune tâche en attente'
you: 'Toi'
summary:
  due: '{count} à échéance proche'
  mine: '{n} assignée à toi | {n} assignées à toi'
action:
  viewAll: 'Voir tout'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zadania'
subtitle: 'Nadchodzące zadania'
empty: 'Brak oczekujących zadań'
you: 'Ty'
summary:
  due: '{count} na wkrótce'
  mine: '{n} przypisane do ciebie'
action:
  viewAll: 'Zobacz wszystkie'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Úkoly'
subtitle: 'Nadcházející úkoly'
empty: 'Žádné čekající úkoly'
you: 'Ty'
summary:
  due: '{count} s blížícím se termínem'
  mine: '{n} přiřazen tobě'
action:
  viewAll: 'Zobrazit vše'
</i18n>
