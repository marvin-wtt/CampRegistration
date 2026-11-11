import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import { removeById, replaceById, upsertById } from '@/utils/collection';
import type {
  Task,
  TaskCreateData,
  TaskUpdateData,
} from '@camp-registration/common/entities';

// Results show in place (rows appear, move or vanish), so writes only report
// failures.
export const useTaskStore = defineStore('task', () => {
  const api = useAPIService();
  const tasks = useCollection<Task>({
    name: 'task',
    key: useRouteKey('eventId'),
    fetch: (eventId) => api.fetchTasks(eventId),
    realtime: {
      resource: 'task',
      fetchOne: (eventId, id) => api.fetchTask(eventId, id),
    },
  });

  function fetchData(eventId?: string) {
    return tasks.load(eventId);
  }

  function createData(createData: TaskCreateData): Promise<Task> {
    return tasks.mutate(
      'create',
      (eventId) => api.createTask(eventId, createData),
      { apply: upsertById },
    );
  }

  async function updateData(
    taskId: string,
    updateData: TaskUpdateData,
  ): Promise<void> {
    await tasks.mutate(
      'update',
      (eventId) => api.updateTask(eventId, taskId, updateData),
      { apply: replaceById },
    );
  }

  function toggleCompleted(task: Task): Promise<void> {
    return updateData(task.id, { completed: !task.completed });
  }

  async function deleteData(taskId: string): Promise<void> {
    await tasks.mutate('delete', (eventId) => api.deleteTask(eventId, taskId), {
      apply: (list) => removeById(list, taskId),
    });
  }

  return {
    data: tasks.data,
    isLoading: tasks.isLoading,
    error: tasks.error,
    reset: tasks.reset,
    fetchData,
    createData,
    updateData,
    toggleCompleted,
    deleteData,
  };
});
