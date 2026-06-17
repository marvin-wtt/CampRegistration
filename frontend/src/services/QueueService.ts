import { api } from 'src/services/api';
import type { QueueInfo } from '@camp-registration/common/entities';

export type { QueueInfo };

export function useQueueService() {
  async function fetchQueues(): Promise<QueueInfo[]> {
    const response = await api.get('admin/queues/');
    return response?.data?.data;
  }

  async function retryFailedJobs(name: string): Promise<void> {
    await api.post(`admin/queues/${name}/failed/retry`);
  }

  async function deleteFailedJobs(name: string): Promise<void> {
    await api.delete(`admin/queues/${name}/failed`);
  }

  return { fetchQueues, retryFailedJobs, deleteFailedJobs };
}
