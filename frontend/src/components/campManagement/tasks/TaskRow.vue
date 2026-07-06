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
      <q-checkbox
        :model-value="task.completed"
        :disable="!canUpdate"
        @update:model-value="emit('toggle')"
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
        <q-icon
          v-if="task.notes"
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
      v-if="canUpdate || canDelete"
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
              v-if="canUpdate"
              clickable
              v-close-popup
              @click="emit('edit')"
            >
              <q-item-section avatar>
                <q-icon
                  name="edit"
                  size="sm"
                />
              </q-item-section>
              <q-item-section>
                {{ t('action.edit') }}
              </q-item-section>
            </q-item>
            <q-item
              v-if="canDelete"
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
import { taskPhaseOf } from 'src/utils/taskPhase';
import { parseLocalDate } from 'src/utils/date';

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
  edit: [];
  delete: [];
}>();

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
}

.task-title--done {
  color: var(--md3-on-surface-variant);
  text-decoration: line-through;
}

.notes-icon {
  flex: 0 0 auto;
  color: var(--md3-on-surface-variant);
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
  edit: 'Edit'
  delete: 'Delete'
</i18n>

<i18n lang="yaml" locale="de">
noDueDate: 'Kein Fälligkeitsdatum'
action:
  menu: 'Aktionen'
  edit: 'Bearbeiten'
  delete: 'Löschen'
</i18n>

<i18n lang="yaml" locale="fr">
noDueDate: "Pas d'échéance"
action:
  menu: 'Actions'
  edit: 'Modifier'
  delete: 'Supprimer'
</i18n>

<i18n lang="yaml" locale="pl">
noDueDate: 'Brak terminu'
action:
  menu: 'Akcje'
  edit: 'Edytuj'
  delete: 'Usuń'
</i18n>

<i18n lang="yaml" locale="cs">
noDueDate: 'Bez termínu'
action:
  menu: 'Akce'
  edit: 'Upravit'
  delete: 'Smazat'
</i18n>
