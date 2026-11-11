<template>
  <q-item
    class="task-row"
    :class="{ 'task-row--mine': mine }"
    clickable
  >
    <q-item-section
      avatar
      class="task-checkbox"
    >
      <task-status-toggle
        :completed="task.completed"
        :disable="!canUpdate"
        @toggle="emit('toggle')"
      />
    </q-item-section>

    <q-item-section
      class="task-main cursor-pointer"
      @click="emit('open')"
    >
      <q-item-label class="row items-center no-wrap q-gutter-x-xs">
        <span
          class="task-title ellipsis"
          :class="{ 'task-title--done': task.completed }"
        >
          {{ task.title }}
        </span>
        <span
          v-if="progress"
          class="checklist-progress row items-center no-wrap"
          :class="{
            'checklist-progress--done': progress.done === progress.total,
          }"
        >
          <q-icon
            name="checklist"
            size="14px"
          />
          {{ progress.done }}/{{ progress.total }}
        </span>
        <q-icon
          v-else-if="task.notes"
          name="notes"
          size="16px"
          class="notes-icon"
        />
      </q-item-label>

      <q-item-label
        caption
        class="task-caption row items-center q-gutter-x-md"
      >
        <span
          class="row items-center q-gutter-x-xs"
          :class="dueTextClass"
        >
          <q-icon
            name="event"
            size="14px"
          />
          {{
            task.dueDate
              ? d(parseLocalDate(task.dueDate), 'date')
              : t('noDueDate')
          }}
        </span>
        <span class="row items-center q-gutter-x-xs">
          <q-icon
            name="person"
            size="14px"
          />
          {{ assigneeLabel }}
        </span>
      </q-item-label>
    </q-item-section>

    <q-item-section
      v-if="canDelete"
      side
      class="task-actions"
    >
      <q-btn
        :aria-label="t('action.menu')"
        icon="more_vert"
        flat
        round
        size="sm"
      >
        <q-menu>
          <q-list style="min-width: 180px">
            <q-item
              clickable
              v-close-popup
              class="text-negative"
              @click="emit('delete')"
            >
              <q-item-section avatar>
                <q-icon
                  name="delete"
                  size="sm"
                />
              </q-item-section>
              <q-item-section>
                {{ t('action.delete') }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import type { Task } from '@camp-registration/common/entities';
import { taskPhaseOf } from '@/utils/taskPhase';
import { parseLocalDate } from '@/utils/date';
import { checklistProgress } from '@/utils/taskNotes';
import TaskStatusToggle from '@/components/event/tasks/TaskStatusToggle.vue';

const { t, d } = useI18n();

const props = defineProps<{
  task: Task;
  mine: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  assigneeLabel: string;
}>();

const emit = defineEmits<{
  toggle: [];
  open: [];
  delete: [];
}>();

const progress = computed(() => checklistProgress(props.task.notes));

const dueTextClass = computed<string>(() => {
  return `due-text--${taskPhaseOf(props.task)}`;
});
</script>

<style scoped>
.task-row {
  padding: 12px 16px;
}

.task-row--mine {
  border-left: 3px solid var(--md3-primary);
  padding-left: 13px;
  background: color-mix(in srgb, var(--md3-primary) 5%, transparent);
}

.task-checkbox {
  min-width: 0;
  padding-right: 8px;
}

.task-main {
  min-width: 0;
}

.task-title {
  min-width: 0;
  font-weight: 500;
  text-decoration: line-through;
  text-decoration-color: transparent;
  transition:
    color 200ms ease,
    text-decoration-color 200ms ease;
}

.task-title--done {
  color: var(--md3-on-surface-variant);
  text-decoration-color: currentColor;
}

@media (prefers-reduced-motion: reduce) {
  .task-title {
    transition: none;
  }
}

.notes-icon {
  flex: 0 0 auto;
  color: var(--md3-on-surface-variant);
}

.checklist-progress {
  flex: 0 0 auto;
  gap: 2px;
  padding: 0 6px;
  border-radius: 6px;
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
  font-size: 12px;
  font-weight: 500;
}

.checklist-progress--done {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.task-caption {
  flex-wrap: wrap;
}

.due-text--overdue {
  color: var(--md3-error);
  font-weight: 600;
}

.due-text--dueSoon {
  color: var(--md3-warning);
  font-weight: 600;
}

.due-text--upcoming,
.due-text--noDueDate,
.due-text--done {
  color: var(--md3-on-surface-variant);
}

.task-actions {
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
noDueDate: 'No due date'
action:
  menu: 'Actions'
  delete: 'Delete'
</i18n>

<i18n lang="yaml" locale="de">
noDueDate: 'Kein Fälligkeitsdatum'
action:
  menu: 'Aktionen'
  delete: 'Löschen'
</i18n>

<i18n lang="yaml" locale="fr">
noDueDate: "Pas d'échéance"
action:
  menu: 'Actions'
  delete: 'Supprimer'
</i18n>

<i18n lang="yaml" locale="pl">
noDueDate: 'Brak terminu'
action:
  menu: 'Akcje'
  delete: 'Usuń'
</i18n>

<i18n lang="yaml" locale="cs">
noDueDate: 'Bez termínu'
action:
  menu: 'Akce'
  delete: 'Smazat'
</i18n>
