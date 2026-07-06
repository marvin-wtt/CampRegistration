<template>
  <q-card
    flat
    bordered
    class="tasks-due-card"
    :class="{ 'tasks-due-card--slim': !hasOpenTasks }"
  >
    <!-- Slim state: nothing pending, keep the footprint small -->
    <q-card-section
      v-if="!hasOpenTasks"
      class="row items-center no-wrap q-gutter-sm"
    >
      <q-icon
        name="task_alt"
        color="positive"
        size="22px"
      />
      <div class="col text-body2 text-grey-7">
        {{ t('empty') }}
      </div>
      <q-btn
        :label="t('action.viewAll')"
        :to="{ name: 'management.camp.tasks' }"
        flat
        no-caps
        dense
        color="primary"
      />
    </q-card-section>

    <!-- Full state: heading, due summary and upcoming list -->
    <template v-else>
      <q-card-section class="row items-center no-wrap q-gutter-sm">
        <div class="tasks-due-icon row items-center justify-center">
          <q-icon
            name="checklist"
            color="primary"
            size="22px"
          />
        </div>
        <div class="col">
          <div class="text-subtitle1 text-weight-bold">
            {{ t('title') }}
          </div>
          <div class="text-caption text-grey-7">
            {{
              dueCount > 0
                ? t('summary.due', { count: dueCount })
                : t('subtitle')
            }}
          </div>
        </div>
        <q-btn
          :label="t('action.viewAll')"
          :to="{ name: 'management.camp.tasks' }"
          flat
          no-caps
          dense
          color="primary"
        />
      </q-card-section>

      <q-list class="q-pb-sm">
        <q-item
          v-for="task in upcomingTasks"
          :key="task.id"
          clickable
          :to="{ name: 'management.camp.tasks' }"
          class="tasks-due-item"
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
    </template>
  </q-card>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, onMounted } from 'vue';
import { useTaskStore } from 'stores/task-store';
import { useCampManagerStore } from 'stores/camp-manager-store';
import { useCurrentManager } from 'src/composables/currentManager';
import type { Task } from '@camp-registration/common/entities';
import { taskPhaseOf } from 'src/utils/taskPhase';
import { parseLocalDate } from 'src/utils/date';

const { t, d } = useI18n();
const taskStore = useTaskStore();
const campManagerStore = useCampManagerStore();
const { currentManagerId } = useCurrentManager();

onMounted(() => {
  // Needed to highlight tasks assigned to the current user. Cached/no-op if
  // another page already loaded the managers for this camp.
  void campManagerStore.fetchData();
});

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
    })
    .slice(0, 5);
});

const dueCount = computed<number>(() => {
  return openTasks.value.filter((task) => {
    const phase = taskPhaseOf(task);
    return phase === 'overdue' || phase === 'dueSoon';
  }).length;
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

.tasks-due-card--slim {
  background: color-mix(in srgb, var(--md3-positive) 5%, var(--md3-surface));
}

.tasks-due-icon {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border-radius: 13px;
  background: rgba(127, 127, 127, 0.1);
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

.mine-badge {
  flex: 0 0 auto;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
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
empty: 'No pending tasks — nice work!'
you: 'You'
summary:
  due: '{count} due soon'
action:
  viewAll: 'View all'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Aufgaben'
subtitle: 'Anstehende Aufgaben'
empty: 'Keine offenen Aufgaben — gut gemacht!'
you: 'Du'
summary:
  due: '{count} bald fällig'
action:
  viewAll: 'Alle anzeigen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Tâches'
subtitle: 'Tâches à venir'
empty: 'Aucune tâche en attente — bien joué !'
you: 'Toi'
summary:
  due: '{count} à échéance proche'
action:
  viewAll: 'Voir tout'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zadania'
subtitle: 'Nadchodzące zadania'
empty: 'Brak oczekujących zadań — świetna robota!'
you: 'Ty'
summary:
  due: '{count} na wkrótce'
action:
  viewAll: 'Zobacz wszystkie'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Úkoly'
subtitle: 'Nadcházející úkoly'
empty: 'Žádné čekající úkoly — skvělá práce!'
you: 'Ty'
summary:
  due: '{count} s blížícím se termínem'
action:
  viewAll: 'Zobrazit vše'
</i18n>
