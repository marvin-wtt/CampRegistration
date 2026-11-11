import { computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Task } from '@camp-registration/common/entities';
import { useTaskStore } from '@/stores/task-store';
import { useEventManagerStore } from '@/stores/event-manager-store';
import { usePermissions } from '@/composables/permissions';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import TaskDetailsDialog from '@/components/event/tasks/dialogs/TaskDetailsDialog.vue';
import TaskFormDialog from '@/components/event/tasks/dialogs/TaskFormDialog.vue';

/** The task dialogs, opened the same way wherever tasks are listed. */
export function useTaskDialogs() {
  const quasar = useQuasar();
  const { t } = useI18n({ useScope: 'global' });
  const taskStore = useTaskStore();
  const eventManagerStore = useEventManagerStore();
  const { can } = usePermissions();

  // The roster only feeds the assignee picker; every role that can create or
  // update a task also holds `event.managers.view`. Permissions resolve after
  // the page mounts, so it is fetched once the answer arrives.
  const canAssign = computed<boolean>(
    () => can('event.tasks.create') || can('event.tasks.update'),
  );
  watch(
    canAssign,
    (allowed) => {
      if (allowed) {
        void eventManagerStore.fetchData();
      }
    },
    { immediate: true },
  );

  function showDetails(task: Task) {
    quasar
      .dialog({
        component: TaskDetailsDialog,
        componentProps: {
          task,
          managers: eventManagerStore.data ?? [],
          canUpdate: can('event.tasks.update'),
          canDelete: can('event.tasks.delete'),
        },
      })
      .onOk((result: { action: 'delete' }) => {
        if (result.action === 'delete') {
          showDelete(task);
        }
      });
  }

  function showAdd() {
    quasar.dialog({
      component: TaskFormDialog,
      componentProps: {
        managers: eventManagerStore.data ?? [],
      },
    });
  }

  function showDelete(task: Task) {
    quasar
      .dialog({
        component: ConfirmDialog,
        componentProps: {
          title: t('tasks.delete.title'),
          message: t('tasks.delete.message', { title: task.title }),
          okLabel: t('tasks.delete.ok'),
          color: 'negative',
        },
      })
      .onOk(() => {
        void taskStore.deleteData(task.id);
      });
  }

  return { showDetails, showAdd, showDelete };
}
