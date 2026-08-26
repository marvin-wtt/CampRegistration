import type {
  Task,
  TaskCreateData,
  TaskUpdateData,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';

export function useTaskService() {
  async function fetchTasks(eventId: string): Promise<Task[]> {
    const response = await api.get(`events/${eventId}/tasks/`);

    return response?.data?.data;
  }

  async function fetchTask(eventId: string, taskId: string): Promise<Task> {
    const response = await api.get(`events/${eventId}/tasks/${taskId}/`);

    return response?.data?.data;
  }

  async function createTask(
    eventId: string,
    data: TaskCreateData,
  ): Promise<Task> {
    const response = await api.post(`events/${eventId}/tasks/`, data);

    return response?.data?.data;
  }

  async function updateTask(
    eventId: string,
    taskId: string,
    data: TaskUpdateData,
  ): Promise<Task> {
    const response = await api.patch(
      `events/${eventId}/tasks/${taskId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteTask(eventId: string, taskId: string): Promise<void> {
    await api.delete(`events/${eventId}/tasks/${taskId}/`);
  }

  return {
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
  };
}
