import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useRealtimeCollection } from 'src/composables/realtimeCollection';
import { useAuthBus, useCampBus } from 'src/composables/bus';
import type {
  Task,
  TaskCreateData,
  TaskUpdateData,
} from '@camp-registration/common/entities';

export const useTaskStore = defineStore('task', () => {
  const route = useRoute();
  const api = useAPIService();
  const authBus = useAuthBus();
  const campBus = useCampBus();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    withProgressNotification,
    lazyFetch,
    checkNotNullWithError,
    checkNotNullWithNotification,
  } = useServiceHandler<Task[]>('task');

  authBus.on('logout', () => {
    reset();
  });

  campBus.on('change', () => {
    invalidate();
  });

  // React to live changes pushed from other clients.
  useRealtimeCollection<Task>('task', {
    data,
    invalidate,
    reload: async () => {
      invalidate();
      await fetchData();
    },
    fetchOne: (campId, id) => api.fetchTask(campId, id),
  });

  async function fetchData(campId?: string) {
    campId ??= route.params.campId as string;

    const cid = checkNotNullWithError(campId);
    await lazyFetch(async () => {
      return await api.fetchTasks(cid);
    });
  }

  async function createData(newData: TaskCreateData) {
    const campId = route.params.campId as string;

    checkNotNullWithError(campId);

    await withProgressNotification('create', async () => {
      const task = await api.createTask(campId, newData);

      data.value?.push(task);
    });
  }

  async function updateData(taskId: string, updateData: TaskUpdateData) {
    const campId = route.params.campId as string;

    checkNotNullWithError(campId);
    checkNotNullWithNotification(taskId);

    await withProgressNotification('update', async () => {
      const task = await api.updateTask(campId, taskId, updateData);

      data.value = data.value?.map((value) =>
        value.id === task.id ? task : value,
      );
    });
  }

  async function toggleCompleted(task: Task) {
    await updateData(task.id, { completed: !task.completed });
  }

  async function deleteData(taskId: string) {
    const campId = route.params.campId as string;

    checkNotNullWithError(campId);
    checkNotNullWithNotification(taskId);

    await withProgressNotification('delete', async () => {
      await api.deleteTask(campId, taskId);

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
