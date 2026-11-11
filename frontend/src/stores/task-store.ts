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
    mutate,
    lazyFetch,
    backgroundFetch,
    checkNotNullWithError,
    checkNotNullWithNotification,
  } = useServiceHandler<Task[]>('task', {
    reload: () => fetchData(undefined, { background: true }),
  });

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
  // notified; the list then reloads and the call rejects with an already
  // reported error.
  async function createData(newData: TaskCreateData): Promise<Task> {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);

    const task = await mutate('create', () => api.createTask(eventId, newData));

    data.value?.push(task);
    return task;
  }

  async function updateData(
    taskId: string,
    updateData: TaskUpdateData,
  ): Promise<void> {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(taskId);

    const task = await mutate('update', () =>
      api.updateTask(eventId, taskId, updateData),
    );

    data.value = data.value?.map((value) =>
      value.id === task.id ? task : value,
    );
  }

  async function toggleCompleted(task: Task): Promise<void> {
    return updateData(task.id, { completed: !task.completed });
  }

  async function deleteData(taskId: string): Promise<void> {
    const eventId = route.params.eventId as string;

    checkNotNullWithError(eventId);
    checkNotNullWithNotification(taskId);

    await mutate('delete', () => api.deleteTask(eventId, taskId));

    data.value = data.value?.filter((task) => task.id !== taskId);
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
