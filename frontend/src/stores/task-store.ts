import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import { useAuthBus, useEventBus } from '@/composables/bus';
import type {
  Task,
  TaskCreateData,
  TaskUpdateData,
} from '@camp-registration/common/entities';

export const useTaskStore = defineStore('task', () => {
  const route = useRoute();
  const api = useAPIService();
  const authBus = useAuthBus();
  const eventBus = useEventBus();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    withErrorNotification,
    lazyFetch,
    backgroundFetch,
    checkNotNullWithError,
    checkNotNullWithNotification,
  } = useServiceHandler<Task[]>('task');

  authBus.on('logout', () => {
    reset();
  });

  eventBus.on('change', () => {
    invalidate();
  });

  // React to live changes pushed from other clients.
  useRealtimeCollection<Task>('task', {
    data,
    invalidate,
    reload: () => fetchData(undefined, { background: true }),
    fetchOne: (eventId, id) => api.fetchTask(eventId, id),
  });

  async function fetchData(eventId?: string, opts?: { background?: boolean }) {
    eventId ??= route.params.eventId as string;

    const cid = checkNotNullWithError(eventId);
    const fetcher = () => api.fetchTasks(cid);
    await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
  }

  // Results show in place (rows appear, move or vanish), so only failures are
  // notified. Each call reports whether it succeeded so callers can roll back.
  async function createData(newData: TaskCreateData): Promise<boolean> {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);

    const task = await withErrorNotification('create', () =>
      api.createTask(eventId, newData),
    );
    if (!task) {
      return false;
    }

    data.value?.push(task);
    return true;
  }

  async function updateData(
    taskId: string,
    updateData: TaskUpdateData,
  ): Promise<boolean> {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(taskId);

    const task = await withErrorNotification('update', () =>
      api.updateTask(eventId, taskId, updateData),
    );
    if (!task) {
      return false;
    }

    data.value = data.value?.map((value) =>
      value.id === task.id ? task : value,
    );
    return true;
  }

  async function toggleCompleted(task: Task): Promise<boolean> {
    return updateData(task.id, { completed: !task.completed });
  }

  async function deleteData(taskId: string): Promise<boolean> {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(taskId);

    const deleted = await withErrorNotification('delete', async () => {
      await api.deleteTask(eventId, taskId);
      return true;
    });
    if (!deleted) {
      return false;
    }

    data.value = data.value?.filter((task) => task.id !== taskId);
    return true;
  }

  return {
    reset,
    data,
    isLoading,
    error,
    fetchData,
    createData,
    updateData,
    toggleCompleted,
    deleteData,
  };
});
