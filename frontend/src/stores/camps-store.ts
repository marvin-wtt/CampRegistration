import { defineStore } from 'pinia';
import type {
  Camp,
  CampCreateData,
  CampUpdateData,
} from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useServiceNotifications } from '@/composables/serviceHandler';
import { useCampBus } from '@/composables/bus';

export const useCampsStore = defineStore('camps', () => {
  const apiService = useAPIService();
  const bus = useCampBus();
  const { withProgressNotification, checkNotNullWithNotification } =
    useServiceNotifications('camp');

  async function createEntry(createData: CampCreateData): Promise<Camp> {
    return withProgressNotification('update', async () => {
      const newCamp = await apiService.createCamp(createData);

      bus.emit('create', newCamp);

      return newCamp;
    });
  }

  async function updateEntry(
    id: string,
    updateData: CampUpdateData,
  ): Promise<Camp | undefined> {
    checkNotNullWithNotification(id);
    return withProgressNotification('update', async () => {
      const updatedCamp = await apiService.updateCamp(id, updateData);

      bus.emit('update', updatedCamp);

      return updatedCamp;
    });
  }

  async function deleteEntry(id: string) {
    checkNotNullWithNotification(id);
    await withProgressNotification('delete', async () => {
      await apiService.deleteCamp(id);

      bus.emit('delete', id);
    });
  }

  return {
    createEntry,
    updateEntry,
    deleteEntry,
  };
});
