import type {
  Task,
  TaskCreateData,
  TaskUpdateData,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';

export function useTaskService() {
  async function fetchTasks(campId: string): Promise<Task[]> {
    const response = await api.get(`camps/${campId}/tasks/`);

    return response?.data?.data;
  }

  async function fetchTask(campId: string, taskId: string): Promise<Task> {
    const response = await api.get(`camps/${campId}/tasks/${taskId}/`);

    return response?.data?.data;
  }

  async function createTask(
    campId: string,
    data: TaskCreateData,
  ): Promise<Task> {
    const response = await api.post(`camps/${campId}/tasks/`, data);

    return response?.data?.data;
  }

  async function updateTask(
    campId: string,
    taskId: string,
    data: TaskUpdateData,
  ): Promise<Task> {
    const response = await api.patch(`camps/${campId}/tasks/${taskId}/`, data);

    return response?.data?.data;
  }

  async function deleteTask(campId: string, taskId: string): Promise<void> {
    await api.delete(`camps/${campId}/tasks/${taskId}/`);
  }

  return {
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
  };
}
