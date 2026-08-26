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
    withProgressNotification,
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

  async function createData(newData: TaskCreateData) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);

    await withProgressNotification('create', async () => {
      const task = await api.createTask(eventId, newData);

      data.value?.push(task);
    });
  }

  async function updateData(taskId: string, updateData: TaskUpdateData) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(taskId);

    await withProgressNotification('update', async () => {
      const task = await api.updateTask(eventId, taskId, updateData);

      data.value = data.value?.map((value) =>
        value.id === task.id ? task : value,
      );
    });
  }

  async function toggleCompleted(task: Task) {
    await updateData(task.id, { completed: !task.completed });
  }

  async function deleteData(taskId: string) {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(taskId);

    await withProgressNotification('delete', async () => {
      await api.deleteTask(eventId, taskId);

      data.value = data.value?.filter((task) => task.id !== taskId);
    });
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
